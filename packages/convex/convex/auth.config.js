import { getAuthConfigProvider } from "@convex-dev/better-auth/auth-config";

// Lets Convex verify the session JWTs that Better Auth issues.
export default {
  providers: [getAuthConfigProvider()],
};
