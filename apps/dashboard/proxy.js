import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { SIGNED_IN_HINT_COOKIE } from "./lib/signed-in-hint";

/**
 * Access control at the edge of the app. DENY BY DEFAULT:
 * a route is only reachable if it's listed here.
 *
 *   Public pages        -> anyone
 *   Public prefixes     -> anyone (the auth flow itself)
 *   Protected pages     -> verified session, otherwise straight to Discord login
 *   Anything else       -> signed in, otherwise 404 (so new routes are never public by accident)
 *   Unlisted /api/*     -> signed in, otherwise 401
 *
 * Protected pages get a real check here (forged/expired cookies never reach them).
 * Everything else only checks that a session cookie exists. Either way, every page and every
 * Convex function ALSO verifies the session itself (defense in depth).
 *
 * It also keeps the readable "signed in" hint cookie in sync with the session cookie,
 * so the static landing page can show the user's navbar without a flash.
 */

const PUBLIC_PAGES = new Set(["/"]);
const PUBLIC_PREFIXES = ["/api/auth/", "/auth/"];
const PROTECTED_PAGES = ["/dashboard"];
const SESSION_PING_PATH = "/api/session";

const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
const JWT_COOKIE = "convex_jwt"; // Better Auth stores it as better-auth.convex_jwt (or __Secure-…)

// Convex's public signing keys. Fetched once, then cached in memory (refetched only on key rotation).
const convexKeys = CONVEX_SITE_URL
  ? createRemoteJWKSet(new URL(`${CONVEX_SITE_URL}/api/auth/convex/jwks`), { timeoutDuration: 5000 })
  : null;

const startsWithSegment = (pathname, base) => pathname === base || pathname.startsWith(`${base}/`);

/**
 * FAST PATH (no network): the signed Convex token in the HttpOnly cookie is checked with
 * Convex's public key. Only Convex holds the private key, so it can't be forged.
 *   "valid"  -> let them in (0 Convex calls)
 *   "renew"  -> token missing or expired: normal for real users, ask Convex (1 call)
 *   "forged" -> bad signature / wrong issuer / malformed: reject without calling Convex
 */
async function checkSignedToken(request) {
  const token = getSessionCookie(request, { cookieName: JWT_COOKIE });
  if (!token) return "renew";
  if (!convexKeys) return "forged"; // misconfigured: fail closed
  try {
    await jwtVerify(token, convexKeys, {
      issuer: CONVEX_SITE_URL,
      audience: "convex",
      algorithms: ["RS256", "EdDSA"],
    });
    return "valid";
  } catch (error) {
    return error?.code === "ERR_JWT_EXPIRED" ? "renew" : "forged";
  }
}

/**
 * SLOW PATH (1 Convex call, when the token is missing or expired): ask Better Auth whether
 * the session is real. On success, Better Auth also returns a fresh signed token cookie.
 * Uses the Convex URL from config (never request headers). Fails CLOSED: any error = no access.
 */
async function checkSessionWithConvex(request) {
  if (!CONVEX_SITE_URL) return { valid: false, setCookies: [] };
  try {
    const res = await fetch(`${CONVEX_SITE_URL}/api/auth/get-session`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { valid: false, setCookies: [] };
    const data = await res.json();
    return { valid: Boolean(data?.session && data?.user), setCookies: res.headers.getSetCookie() };
  } catch {
    return { valid: false, setCookies: [] };
  }
}

/** Continue to the page, passing any refreshed cookies to both the page (now) and the browser (later). */
function nextWithCookies(request, setCookies) {
  if (!setCookies.length) return NextResponse.next();
  const jar = new Map(
    (request.headers.get("cookie") ?? "")
      .split(/;\s*/)
      .filter(Boolean)
      .map((pair) => [pair.slice(0, pair.indexOf("=")), pair.slice(pair.indexOf("=") + 1)]),
  );
  for (const cookie of setCookies) {
    const [pair] = cookie.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1));
  }
  const headers = new Headers(request.headers);
  headers.set("cookie", [...jar].map(([name, value]) => `${name}=${value}`).join("; "));
  const response = NextResponse.next({ request: { headers } });
  for (const cookie of setCookies) response.headers.append("set-cookie", cookie);
  return response;
}

function syncSignedInHint(request, response, signedIn) {
  const hasHint = request.cookies.get(SIGNED_IN_HINT_COOKIE)?.value === "1";
  if (signedIn && !hasHint) {
    response.cookies.set(SIGNED_IN_HINT_COOKIE, "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // same as the session
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      httpOnly: false, // read by the inline script in the root layout
    });
  } else if (!signedIn && hasHint) {
    response.cookies.delete(SIGNED_IN_HINT_COOKIE);
  }
  return response;
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const signedIn = getSessionCookie(request) !== null;
  const done = (response) => syncSignedInHint(request, response, signedIn);

  // Session watcher ping for open dashboard tabs: "is there a session cookie?" Answered here,
  // never calls Convex, so it costs nothing. (Real verification happens on every page load.)
  if (pathname === SESSION_PING_PATH) {
    return done(new NextResponse(null, { status: signedIn ? 204 : 401, headers: { "cache-control": "no-store" } }));
  }

  if (PUBLIC_PAGES.has(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return done(NextResponse.next());
  }

  if (PROTECTED_PAGES.some((base) => startsWithSegment(pathname, base))) {
    // The session cookie must exist (deleting it = logged out), plus a verified session:
    // signed token checked locally (0 calls), or, if it's missing/expired, Better Auth (1 call).
    if (signedIn) {
      const token = await checkSignedToken(request);
      if (token === "valid") return done(NextResponse.next());
      if (token === "renew") {
        const { valid, setCookies } = await checkSessionWithConvex(request);
        if (valid) return done(nextWithCookies(request, setCookies));
      }
    }
    // No login page: send them straight into the Discord login flow.
    const response = NextResponse.redirect(new URL("/auth/discord", request.url));
    response.headers.set("cache-control", "private, no-store");
    return done(response);
  }

  if (signedIn) return done(NextResponse.next());

  if (pathname.startsWith("/api/")) {
    return done(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  // Not a known public page: show the normal 404 page.
  return done(NextResponse.rewrite(new URL("/__not-found", request.url)));
}

export const config = {
  // Skip Next.js internals, the dev overlay and static files (anything with a file extension).
  matcher: ["/((?!_next/|__nextjs|.*\\.[a-zA-Z0-9]+$).*)"],
};
