// Shared by server code (lib/guilds.js) and the server picker (client).

/** A saved server list older than this is re-read from Discord before it's trusted again. */
export const SERVER_LIST_STALE_MS = 5 * 60 * 1000;

export const isServerListStale = (refreshedAt, now = Date.now()) =>
  refreshedAt === null || now - refreshedAt > SERVER_LIST_STALE_MS;
