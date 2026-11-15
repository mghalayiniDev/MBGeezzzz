import { NextResponse } from "next/server";
import { api } from "@mbgeezzzz/convex/api";
import { fetchAuthQuery } from "@/lib/auth-server";

/**
 * GET /api/me: the signed-in user's public profile for the landing page navbar.
 * Returns only { name, image } (users.me never exposes IDs, emails or tokens).
 * Logged-out requests never reach this: proxy.js answers 401 without calling Convex.
 */
export async function GET() {
  let user = null;
  try {
    user = await fetchAuthQuery(api.users.me);
  } catch {
    user = null;
  }
  return NextResponse.json({ user }, { headers: { "cache-control": "private, no-store" } });
}
