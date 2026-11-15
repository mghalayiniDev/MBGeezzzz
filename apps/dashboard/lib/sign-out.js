import { SIGNED_IN_HINT_COOKIE } from "./signed-in-hint";

/**
 * Logs out (browser only), then does a full page load of the home page. Throws if logging out
 * failed. Used by every "Log out" button (dashboard header, landing navbar dropdown).
 */
export async function signOutAndReload() {
  // Loaded on demand so the auth client never weighs down pages until someone logs out.
  const { authClient } = await import("./auth-client");
  const { error } = await authClient.signOut();
  if (error) throw error;
  // Drop the navbar's "signed in" hint right away (proxy.js would also clear it on the next request).
  document.cookie = `${SIGNED_IN_HINT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  // Full page load on purpose (not router.push): it clears the client router cache,
  // so no signed-in data stays in memory after logging out.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign("/");
}
