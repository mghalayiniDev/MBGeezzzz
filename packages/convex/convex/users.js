import { v } from "convex/values";
import { query } from "./_generated/server";
import { getSessionUser } from "./lib/auth";

/**
 * The signed-in user's public profile, or null when signed out (used by the landing navbar).
 * Only the fields the dashboard shows leave the server (no IDs, emails or tokens).
 */
export const me = query({
  args: {},
  returns: v.union(v.null(), v.object({ name: v.string(), image: v.union(v.string(), v.null()) })),
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    if (!user) return null;
    return { name: user.name, image: user.image };
  },
});
