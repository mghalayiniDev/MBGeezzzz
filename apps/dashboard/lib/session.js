import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { api } from "@mbgeezzzz/convex/api";
import { fetchAuthQuery } from "./auth-server";

/**
 * Data access layer. ONE Convex call per dashboard request: who's signed in (session verified
 * in Convex) plus their saved server list. `cache` shares the result between the layout and
 * the page of the same request, so they never call Convex twice.
 */
export const getDashboardContext = cache(async () => {
  // Request-time only. Better Auth's token cache compares expiry times with the clock before it
  // reads cookies, and Cache Components refuses clock reads while prerendering (blocking-prerender-current-time).
  await connection();
  return await fetchAuthQuery(api.guilds.context);
});

/**
 * The ONE place server code gets the current user. Verifies the session with Convex (the real
 * check; proxy.js only looks at the cookie). No valid session -> straight back into Discord login.
 */
export const getCurrentUser = cache(async () => {
  const context = await getDashboardContext();
  if (!context) redirect("/auth/discord");
  return context.me;
});
