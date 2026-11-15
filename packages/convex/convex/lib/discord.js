// Calls to Discord's API made with a user's OAuth token (server-side only; the token never
// leaves Convex). Uses plain fetch, so it runs in the default Convex runtime.

const DISCORD_API = "https://discord.com/api/v10";
const TIMEOUT_MS = 5000;

const ADMINISTRATOR = 1n << 3n;
const MANAGE_GUILD = 1n << 5n;

const SNOWFLAKE = /^\d{17,20}$/;
const ICON_HASH = /^(a_)?[0-9a-f]{32}$/;
// Discord caps a user at 200 servers, and this endpoint returns up to 200 per page.
const PAGE_SIZE = 200;
const MAX_PAGES = 3;

/** Discord rejected the token (expired or revoked): the user has to log in again. */
export class DiscordAuthError extends Error {}

async function discordGet(path, accessToken) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${DISCORD_API}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
    if (res.status === 401) throw new DiscordAuthError("Discord rejected the token");
    if (!res.ok) throw new Error(`Discord responded ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function parsePermissions(value) {
  try {
    return BigInt(typeof value === "string" ? value : "0");
  } catch {
    return 0n;
  }
}

/**
 * The servers this user may manage (owner, Administrator or Manage Server), validated and
 * trimmed to what we store: { id, name, icon, owner }.
 */
export async function fetchManageableGuilds(accessToken) {
  const result = [];
  const seen = new Set(); // one entry per server, even if a page repeats one
  let after = "0";
  for (let page = 0; page < MAX_PAGES; page++) {
    const list = await discordGet(`/users/@me/guilds?limit=${PAGE_SIZE}&after=${after}`, accessToken);
    if (!Array.isArray(list)) throw new Error("Unexpected response from Discord");

    for (const guild of list) {
      // Treat the response as untrusted: keep only well-formed entries.
      if (!guild || typeof guild.id !== "string" || !SNOWFLAKE.test(guild.id) || seen.has(guild.id)) continue;
      if (typeof guild.name !== "string" || guild.name.length === 0) continue;
      const owner = guild.owner === true;
      const permissions = parsePermissions(guild.permissions);
      if (!owner && (permissions & (ADMINISTRATOR | MANAGE_GUILD)) === 0n) continue;
      seen.add(guild.id);
      result.push({
        id: guild.id,
        name: guild.name.slice(0, 100),
        icon: typeof guild.icon === "string" && ICON_HASH.test(guild.icon) ? guild.icon : null,
        owner,
      });
    }

    if (list.length < PAGE_SIZE) break;
    after = list[list.length - 1].id;
  }
  return result;
}
