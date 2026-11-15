import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// App tables. (Better Auth's users/sessions/accounts live in its own component, not here.)
export default defineSchema({
  // Servers a user may manage: owner, Administrator or Manage Server, copied from Discord's
  // "my servers" API. The source of truth for requireGuildAdmin. Written only by guilds.saveAccess.
  guildAccess: defineTable({
    userId: v.string(), // Better Auth user id
    guildId: v.string(), // Discord server id (snowflake)
    name: v.string(),
    icon: v.union(v.string(), v.null()), // Discord icon hash
    owner: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_guildId", ["userId", "guildId"]),

  // One small doc per user: when their server list was last refreshed from Discord, plus the
  // refresh rate limit and their Discord account's Better Auth id (saves a lookup per refresh).
  guildListSyncs: defineTable({
    userId: v.string(),
    refreshedAt: v.union(v.number(), v.null()), // last successful refresh (null = never)
    lastAttemptAt: v.optional(v.number()), // rate limit: minimum gap between refreshes
    dayStart: v.optional(v.number()), // rate limit: start of the current 24h window
    dayCount: v.optional(v.number()), // rate limit: refreshes in that window
    accountId: v.optional(v.string()), // Better Auth account id of the user's Discord login
  }).index("by_userId", ["userId"]),

  // Servers the bot is in. Written by the bot (bot-only functions, coming with the bot);
  // the dashboard only reads it to show "Manage" vs "Add bot".
  botGuilds: defineTable({
    guildId: v.string(),
  }).index("by_guildId", ["guildId"]),
});
