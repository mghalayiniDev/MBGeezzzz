import { handler } from "@/lib/auth-server";

// Forwards /api/auth/* (Discord callback, sign-out, session) to Better Auth in Convex.
// Cookies are set on this site's domain.
export const { GET, POST } = handler;
