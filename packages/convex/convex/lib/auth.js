import { ConvexError } from "convex/values";
import { components } from "../_generated/api";

/**
 * The signed-in user, or null. Who you are comes from the signed Convex token; then ONE database
 * read checks that the session still exists and hasn't expired, so logging out cuts access off
 * immediately (same check as @convex-dev/better-auth's getAuthUser, minus its extra user-record
 * read: name and picture are in the token, see `definePayload` in auth.js).
 * Works in queries, mutations and actions (including internal functions called from an action,
 * which run with the caller's identity).
 */
export async function getSessionUser(ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity || typeof identity.sessionId !== "string") return null;
  const session = await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: "session",
    where: [
      { field: "_id", value: identity.sessionId },
      { field: "expiresAt", operator: "gt", value: Date.now() },
    ],
  });
  if (!session || session.userId !== identity.subject) return null;
  return {
    _id: identity.subject,
    name: typeof identity.name === "string" ? identity.name : "",
    image: typeof identity.image === "string" ? identity.image : null,
  };
}

/** Returns the signed-in user or throws. Every function that needs a user calls this first. */
export async function requireUser(ctx) {
  const user = await getSessionUser(ctx);
  if (!user) throw new ConvexError("Unauthorized");
  return user;
}

/**
 * The user's access row for a server, or null. Access comes from `guildAccess` (owner,
 * Administrator or Manage Server), refreshed from Discord whenever the dashboard's list is
 * older than a few minutes. Queries and mutations only (needs ctx.db).
 */
export async function findGuildAccess(ctx, user, guildId) {
  return await ctx.db
    .query("guildAccess")
    .withIndex("by_userId_and_guildId", (q) => q.eq("userId", user._id).eq("guildId", guildId))
    .unique();
}

/**
 * Throws unless the signed-in user may manage this server. Every dashboard query that reads a
 * server's settings calls this first (mutations use requireGuildAdminForWrite below). Never trust
 * a guildId from the browser without it.
 */
export async function requireGuildAdmin(ctx, guildId) {
  const user = await requireUser(ctx);
  const access = await findGuildAccess(ctx, user, guildId);
  if (!access) throw new ConvexError("Forbidden");
  return { user, access };
}

// A saved server list older than this can't authorize a change (pages refresh at 5 minutes).
const WRITE_MAX_AGE_MS = 10 * 60 * 1000;

/**
 * For MUTATIONS that change a server's settings: requireGuildAdmin, plus the user's saved server
 * list must be recent. So if someone loses Manage Server (or the server is deleted), a saved copy
 * can't keep letting them change settings. (Mutations may read the clock; queries can't, which
 * is why this is a separate helper.) Throws ConvexError("ServerListStale"): the dashboard then
 * refreshes the list (guilds.refresh) and retries once.
 */
export async function requireGuildAdminForWrite(ctx, guildId) {
  const result = await requireGuildAdmin(ctx, guildId);
  const sync = await ctx.db
    .query("guildListSyncs")
    .withIndex("by_userId", (q) => q.eq("userId", result.user._id))
    .unique();
  if (!sync?.refreshedAt || Date.now() - sync.refreshedAt > WRITE_MAX_AGE_MS) {
    throw new ConvexError("ServerListStale");
  }
  return result;
}
