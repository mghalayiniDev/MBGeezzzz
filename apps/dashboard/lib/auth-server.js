import "server-only";
import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

/**
 * Errors our own Convex functions throw on purpose for "not signed in" (e.g. requireUser).
 * For these, retrying with a fresh token is pointless, so the helper rethrows them as-is.
 */
function isAuthError(error) {
  const message = String(error?.data ?? error?.message ?? "");
  return /unauthenticated|unauthorized/i.test(message);
}

// Server-side auth helpers. Better Auth itself runs in Convex; these forward requests and
// attach the user's session token to Convex calls made from Server Components.
//
// jwtCache: reuse the signed Convex token from the (HttpOnly) `better-auth.convex_jwt` cookie
// instead of asking Convex for a new one on every request. Saves one Convex call per page.
// Convex still verifies the token's signature AND that the session exists on every query,
// so logging out cuts access off immediately.
export const { handler, isAuthenticated, getToken, fetchAuthQuery, fetchAuthMutation, fetchAuthAction } =
  convexBetterAuthNextJs({
    convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
    convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
    jwtCache: { enabled: true, isAuthError },
  });

/** The site's own origin, from config (never from request headers, which can be spoofed). */
export function siteOrigin() {
  const url = process.env.SITE_URL;
  if (!url) throw new Error("SITE_URL is not set");
  return new URL(url).origin;
}
