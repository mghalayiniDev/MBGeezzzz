"use server";

import { refresh } from "next/cache";
import { api } from "@mbgeezzzz/convex/api";
import { fetchAuthAction } from "@/lib/auth-server";

/**
 * "Refresh" button on the server picker: re-reads the user's servers from Discord.
 * Convex checks the session and rate-limits it per user; this only forwards the call.
 * Returns only a status (the page re-renders with the fresh list).
 */
export async function refreshServers() {
  try {
    const result = await fetchAuthAction(api.guilds.refresh, {});
    if (!result.ok) return { ok: false, error: result.error, retryAfter: result.retryAfter };
    refresh();
    return { ok: true, error: null, retryAfter: null };
  } catch {
    // Session gone or Convex unreachable: the client shows a generic message.
    return { ok: false, error: "failed", retryAfter: null };
  }
}
