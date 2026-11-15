import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";

// Browser-side auth client (same-origin /api/auth). Used for signing out.
// Signing in never needs it: login buttons are plain links to /auth/discord.
export const authClient = createAuthClient({
  plugins: [convexClient()],
});
