import { NextResponse } from "next/server";
import { handler, siteOrigin } from "@/lib/auth-server";

const DISCORD_ORIGIN = "https://discord.com";

/**
 * GET /auth/discord: starts "Log in with Discord" and redirects straight to Discord.
 * There is no login page; every login button links here.
 *
 * Security:
 * - Where to go after login is fixed here (/dashboard), so nobody can turn this into an open redirect.
 * - Better Auth creates the OAuth `state` (stored in a short-lived cookie we forward), and checks it
 *   on the callback, so a forged callback can't log someone into the wrong account.
 * - We only ever redirect to discord.com.
 */
export async function GET(request) {
  // Only a real page navigation starts a login. Background requests (link prefetches, or a
  // client-router fetch that proxy.js redirected here) get an empty reply: otherwise they would
  // create OAuth states and use up the login rate limit (10/min) before anyone clicks. On a real
  // click the router then loads this URL as a full page, which starts the login normally.
  const fetchMode = request.headers.get("sec-fetch-mode");
  const background =
    request.headers.has("rsc") || request.headers.has("next-router-prefetch") || (fetchMode && fetchMode !== "navigate");
  if (background) return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });

  const origin = siteOrigin();
  const failed = () => NextResponse.redirect(new URL("/?auth=error", origin));

  const forwarded = new Headers({
    "content-type": "application/json",
    origin, // Better Auth's CSRF check: the request comes from our own site
  });
  // Keep the visitor's IP and browser so Better Auth's rate limiter counts per visitor.
  for (const name of ["x-forwarded-for", "x-real-ip", "cf-connecting-ip", "user-agent"]) {
    const value = request.headers.get(name);
    if (value) forwarded.set(name, value);
  }

  let res;
  try {
    res = await handler.POST(
      new Request(`${origin}/api/auth/sign-in/social`, {
        method: "POST",
        headers: forwarded,
        body: JSON.stringify({
          provider: "discord",
          callbackURL: "/dashboard",
          errorCallbackURL: "/?auth=error",
          disableRedirect: true,
        }),
      }),
    );
  } catch {
    return failed();
  }

  if (!res.ok) return failed();
  const data = await res.json().catch(() => null);
  if (!data?.url) return failed();

  const target = new URL(data.url);
  if (target.origin !== DISCORD_ORIGIN) return failed();

  const response = NextResponse.redirect(target);
  for (const cookie of res.headers.getSetCookie()) response.headers.append("set-cookie", cookie);
  response.headers.set("cache-control", "no-store");
  return response;
}
