import { defineApp } from "convex/server";
import betterAuth from "@convex-dev/better-auth/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";

const app = defineApp();

// Better Auth stores users, sessions, OAuth accounts and rate-limit counters in its own component tables.
app.use(betterAuth);
// Per-user rate limits, reserved for dashboard saves (Phase 1, ~30/min). The server-list refresh
// keeps its own limit in guildListSyncs instead (saves two function calls per refresh).
app.use(rateLimiter);

export default app;
