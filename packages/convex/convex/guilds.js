import { ConvexError, v } from "convex/values";
import { components, internal } from "./_generated/api";
import { action, internalMutation, query } from "./_generated/server";
import { createAuth } from "./auth";
import { getSessionUser } from "./lib/auth";
import { DiscordAuthError, fetchManageableGuilds } from "./lib/discord";

// Discord caps a user at 200 servers; this bounds every read of a user's list.
const MAX_GUILDS = 250;

// Refresh rate limit, per user (kept in their guildListSyncs doc).
const MIN_GAP_MS = 15 * 1000; // at most one refresh every 15 seconds
const DAILY_MAX = 60; // and 60 per 24h: about 5 hours of active use at one refresh per 5 minutes
const DAY_MS = 24 * 60 * 60 * 1000;

/** What the dashboard gets for each server (no tokens, no permission bits, no other users). */
const guildValidator = v.object({
  id: v.string(),
  name: v.string(),
  icon: v.union(v.string(), v.null()),
  owner: v.boolean(),
  botInstalled: v.boolean(),
});

const refreshError = v.union(
  v.literal("rate_limited"), // refreshed too often, try again shortly
  v.literal("reauth_required"), // Discord token expired or revoked: log in again
  v.literal("discord_unavailable"), // Discord didn't answer (or answered with an error)
);

/** Adds "is the bot in this server?" and sorts: servers with the bot first, then by name. */
async function withBotStatus(ctx, rows) {
  const guilds = await Promise.all(
    rows.map(async (row) => {
      const bot = await ctx.db
        .query("botGuilds")
        .withIndex("by_guildId", (q) => q.eq("guildId", row.guildId))
        .first();
      return { id: row.guildId, name: row.name, icon: row.icon, owner: row.owner, botInstalled: bot !== null };
    }),
  );
  return guilds.sort((a, b) => Number(b.botInstalled) - Number(a.botInstalled) || a.name.localeCompare(b.name));
}

async function getSync(ctx, userId) {
  return await ctx.db
    .query("guildListSyncs")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
}

/**
 * Everything the dashboard layout and pages need, in ONE call: who's signed in, their manageable
 * servers (as last saved) and when that list was refreshed (null = never). Null when signed out.
 * The caller decides when the list is stale.
 */
export const context = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      me: v.object({ name: v.string(), image: v.union(v.string(), v.null()) }),
      refreshedAt: v.union(v.number(), v.null()),
      guilds: v.array(guildValidator),
    }),
  ),
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    if (!user) return null;
    const sync = await getSync(ctx, user._id);
    const rows = await ctx.db
      .query("guildAccess")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(MAX_GUILDS);
    return {
      me: { name: user.name, image: user.image },
      refreshedAt: sync?.refreshedAt ?? null,
      guilds: await withBotStatus(ctx, rows),
    };
  },
});

/**
 * Refresh step 1 (runs with the caller's identity): checks the session and the per-user rate
 * limit in one small transaction, and returns the cached Discord account id. The limit lives in
 * the user's own doc, so concurrent refreshes are serialized by Convex transactions (no race)
 * and it costs no extra function calls (the rate-limiter component would add two per refresh).
 */
export const startRefresh = internalMutation({
  args: {},
  returns: v.union(
    v.object({ ok: v.literal(true), userId: v.string(), accountId: v.union(v.string(), v.null()) }),
    v.object({
      ok: v.literal(false),
      error: v.union(v.literal("unauthorized"), v.literal("rate_limited")),
      retryAfter: v.union(v.number(), v.null()),
    }),
  ),
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    if (!user) return { ok: false, error: "unauthorized", retryAfter: null };

    const now = Date.now();
    const sync = await getSync(ctx, user._id);
    if (sync?.lastAttemptAt && now - sync.lastAttemptAt < MIN_GAP_MS) {
      return { ok: false, error: "rate_limited", retryAfter: MIN_GAP_MS - (now - sync.lastAttemptAt) };
    }
    const newWindow = !sync?.dayStart || now - sync.dayStart >= DAY_MS;
    const dayStart = newWindow ? now : sync.dayStart;
    const dayCount = newWindow ? 0 : (sync.dayCount ?? 0);
    if (dayCount >= DAILY_MAX) return { ok: false, error: "rate_limited", retryAfter: dayStart + DAY_MS - now };

    const fields = { lastAttemptAt: now, dayStart, dayCount: dayCount + 1 };
    if (sync) await ctx.db.patch("guildListSyncs", sync._id, fields);
    else await ctx.db.insert("guildListSyncs", { userId: user._id, refreshedAt: null, ...fields });
    return { ok: true, userId: user._id, accountId: sync?.accountId ?? null };
  },
});

/** Better Auth account id of the user's Discord login (only needed on a user's first refresh). */
async function findDiscordAccountId(ctx, userId) {
  const account = await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: "account",
    where: [
      { field: "providerId", value: "discord" },
      { field: "userId", value: userId },
    ],
  });
  return account?._id ?? null;
}

/**
 * Server-side Better Auth call with the user id from the verified token (never from the
 * browser): it only looks inside this user's accounts, decrypts the token, and renews it with
 * Discord if it expired. One database read. The token never leaves Convex.
 */
async function accessTokenFor(ctx, userId, accountId) {
  const { accessToken } = await createAuth(ctx).api.getAccessToken({ body: { accountId, userId } });
  return accessToken || null;
}

/** The user's Discord access token and account id, or null if there's no usable token. */
async function discordAccessToken(ctx, userId, cachedAccountId) {
  if (cachedAccountId) {
    try {
      const accessToken = await accessTokenFor(ctx, userId, cachedAccountId);
      if (accessToken) return { accessToken, accountId: cachedAccountId };
    } catch {
      // Cached id no longer valid (e.g. the account was re-created): look it up again below.
    }
  }
  try {
    const accountId = await findDiscordAccountId(ctx, userId);
    if (!accountId) return null;
    const accessToken = await accessTokenFor(ctx, userId, accountId);
    return accessToken ? { accessToken, accountId } : null;
  } catch {
    return null;
  }
}

/**
 * Re-reads the user's servers from Discord and saves the ones they can manage.
 * About 5 function calls: this action, startRefresh (+ its session read), the token read and
 * saveAccess. (A user's very first refresh adds one lookup of their Discord account id.)
 * Returns the fresh list, or why it couldn't refresh.
 */
export const refresh = action({
  args: {},
  returns: v.union(
    v.object({ ok: v.literal(true), refreshedAt: v.number(), guilds: v.array(guildValidator) }),
    v.object({ ok: v.literal(false), error: refreshError, retryAfter: v.union(v.number(), v.null()) }),
  ),
  handler: async (ctx) => {
    const start = await ctx.runMutation(internal.guilds.startRefresh, {});
    if (!start.ok) {
      if (start.error === "unauthorized") throw new ConvexError("Unauthorized");
      return { ok: false, error: "rate_limited", retryAfter: start.retryAfter };
    }

    const token = await discordAccessToken(ctx, start.userId, start.accountId);
    if (!token) return { ok: false, error: "reauth_required", retryAfter: null };

    let guilds;
    try {
      guilds = await fetchManageableGuilds(token.accessToken);
    } catch (error) {
      const code = error instanceof DiscordAuthError ? "reauth_required" : "discord_unavailable";
      return { ok: false, error: code, retryAfter: null };
    }

    const saved = await ctx.runMutation(internal.guilds.saveAccess, {
      accountId: token.accountId,
      guilds: guilds.slice(0, MAX_GUILDS),
    });
    return { ok: true, ...saved };
  },
});

/**
 * Refresh step 2: replaces the user's saved server list with the fresh one (only changed rows
 * are written). Internal; the user comes from the caller's identity, never from arguments.
 */
export const saveAccess = internalMutation({
  args: {
    accountId: v.string(),
    guilds: v.array(
      v.object({ id: v.string(), name: v.string(), icon: v.union(v.string(), v.null()), owner: v.boolean() }),
    ),
  },
  returns: v.object({ refreshedAt: v.number(), guilds: v.array(guildValidator) }),
  handler: async (ctx, { accountId, guilds }) => {
    // startRefresh checked the session moments ago; the signed identity is enough here.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");
    const userId = identity.subject;

    const existing = await ctx.db
      .query("guildAccess")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(MAX_GUILDS);
    const existingById = new Map(existing.map((row) => [row.guildId, row]));
    const freshIds = new Set(guilds.map((guild) => guild.id));

    for (const guild of guilds) {
      const row = existingById.get(guild.id);
      const fields = { name: guild.name, icon: guild.icon, owner: guild.owner };
      if (!row) {
        await ctx.db.insert("guildAccess", { userId, guildId: guild.id, ...fields });
      } else if (row.name !== fields.name || row.icon !== fields.icon || row.owner !== fields.owner) {
        await ctx.db.patch("guildAccess", row._id, fields);
      }
    }
    // Lost access (left the server, it was deleted, or Manage Server was taken away): remove it.
    for (const row of existing) {
      if (!freshIds.has(row.guildId)) await ctx.db.delete("guildAccess", row._id);
    }

    const refreshedAt = Date.now();
    const sync = await getSync(ctx, userId);
    if (sync) await ctx.db.patch("guildListSyncs", sync._id, { refreshedAt, accountId });
    else await ctx.db.insert("guildListSyncs", { userId, refreshedAt, accountId });

    const rows = guilds.map((guild) => ({ guildId: guild.id, name: guild.name, icon: guild.icon, owner: guild.owner }));
    return { refreshedAt, guilds: await withBotStatus(ctx, rows) };
  },
});
