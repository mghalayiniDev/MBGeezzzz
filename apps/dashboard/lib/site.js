// One place for the name, links and prices used across the site.
// Links marked TODO point to pages or resources that don't exist yet.

// Permissions the bot asks for when it's added to a server: only what the features need.
const BOT_PERMISSIONS = [
  1n << 1n, // Kick Members (/kick)
  1n << 2n, // Ban Members (/ban, /unban)
  1n << 5n, // Manage Server (sync rules to Discord's AutoMod)
  1n << 7n, // View Audit Log (logging: who did what)
  1n << 10n, // View Channels
  1n << 11n, // Send Messages
  1n << 13n, // Manage Messages (/purge, AutoMod deletes)
  1n << 14n, // Embed Links
  1n << 16n, // Read Message History
  1n << 28n, // Manage Roles (button roles, auto-roles)
  1n << 40n, // Moderate Members (/timeout)
].reduce((all, bit) => all | bit, 0n);

/**
 * "Add the bot" link. With a guildId, Discord opens with that server already picked.
 * Built from the public client ID (NEXT_PUBLIC_DISCORD_CLIENT_ID), or from a full
 * NEXT_PUBLIC_DISCORD_INVITE_URL if one is set. Null when neither is configured.
 */
export function botInviteUrl(guildId) {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  const custom = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL;
  let url;
  if (custom) {
    url = new URL(custom);
  } else if (clientId) {
    url = new URL("https://discord.com/oauth2/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("scope", "bot applications.commands");
    url.searchParams.set("permissions", BOT_PERMISSIONS.toString());
  } else {
    return null;
  }
  if (guildId) {
    url.searchParams.set("guild_id", guildId);
    url.searchParams.set("disable_guild_select", "true");
  }
  return url.toString();
}

export const site = {
  name: "MBGeezzzz",
  tagline: "The Discord bot you can program",
  description:
    "MBGeezzzz is a multi-purpose Discord bot with a real-time dashboard. Moderation, automod, embeds and role menus, plus a public API and signed webhooks for developers.",
  year: 2026,
  links: {
    // Public (not a secret): built from NEXT_PUBLIC_DISCORD_CLIENT_ID (see botInviteUrl above).
    invite: botInviteUrl() || "#",
    login: "/auth/discord", // starts Discord login directly (no login page)
    dashboard: "/dashboard", // logged-out visitors are sent to Discord login by proxy.js
    support: "#", // TODO: support server invite
    status: "#", // TODO Phase 0: bot status page (real numbers from Convex once the bot runs)
    docs: "#", // TODO Phase 5: API docs
    privacy: "#", // TODO Phase 6: required by Paddle before launch
    terms: "#", // TODO Phase 6: required by Paddle before launch
    refunds: "#", // TODO Phase 6: required by Paddle before launch
  },
  // Placeholder for the API example until we own a domain.
  apiBase: "https://api.mbgeezzzz.com",
};

// Prices per server, in USD. Change them here and the pricing section updates.
export const pricing = {
  proMonthly: 8,
  yearlyDiscount: 0.2,
};
