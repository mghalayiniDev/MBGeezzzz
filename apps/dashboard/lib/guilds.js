import "server-only";
import { redirect } from "next/navigation";
import { api } from "@mbgeezzzz/convex/api";
import { fetchAuthAction } from "./auth-server";
import { isServerListStale } from "./server-list";
import { getDashboardContext } from "./session";

/** Discord server ids are 17-20 digit snowflakes. */
export const isGuildId = (value) => typeof value === "string" && /^\d{17,20}$/.test(value);

/** Re-reads the list from Discord (~4 Convex calls). Only called when the saved list is stale. */
const refreshFromDiscord = () => fetchAuthAction(api.guilds.refresh, {});

/**
 * The signed-in user's manageable servers. Cost: nothing extra when the saved list is fresh (it
 * came with the request's one context call); a refresh when it's 5+ minutes old. If Discord
 * can't be reached, the last saved list is returned with an `error` code.
 */
export async function getMyGuilds() {
  const context = await getDashboardContext();
  if (!context) redirect("/auth/discord");
  if (!isServerListStale(context.refreshedAt)) return { refreshedAt: context.refreshedAt, guilds: context.guilds, error: null };

  const result = await refreshFromDiscord();
  if (result.ok) return { refreshedAt: result.refreshedAt, guilds: result.guilds, error: null };
  return { refreshedAt: context.refreshedAt, guilds: context.guilds, error: result.error };
}

/**
 * One server the user may manage, or null (unknown id, no access, or gone). Like the list, it
 * re-checks with Discord when the saved list is stale, so a deleted server or lost Manage Server
 * permission disappears here too, even when this page is opened directly.
 */
export async function getGuild(guildId) {
  if (!isGuildId(guildId)) return null;
  const context = await getDashboardContext();
  if (!context) redirect("/auth/discord");
  const saved = context.guilds.find((guild) => guild.id === guildId) ?? null;
  if (!isServerListStale(context.refreshedAt)) return saved;

  const result = await refreshFromDiscord();
  // Fresh from Discord: if the server isn't in the list anymore, it's gone for this user.
  if (result.ok) return result.guilds.find((guild) => guild.id === guildId) ?? null;
  // Discord token expired or revoked: log in again (lands on /dashboard, so no loop).
  if (result.error === "reauth_required") redirect("/auth/discord");
  // Discord briefly unavailable or rate-limited: show the saved copy. Changing settings is still
  // refused once the list is too old (requireGuildAdminForWrite in Convex).
  return saved;
}
