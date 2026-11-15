import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { components } from "./_generated/api";
import authConfig from "./auth.config";

// Environment variables (set with `npx convex env set`, never committed):
//   SITE_URL               e.g. http://localhost:3000 (must match the URL people browse)
//   BETTER_AUTH_SECRET     random 32+ byte secret: signs sessions and encrypts stored OAuth tokens
//   DISCORD_CLIENT_ID      from the Discord Developer Portal (public)
//   DISCORD_CLIENT_SECRET  from the Discord Developer Portal (secret)
const siteUrl = process.env.SITE_URL;

export const authComponent = createClient(components.betterAuth);

/**
 * Better Auth, configured for Discord-only sign-in. Runs inside Convex functions only.
 * Security choices are explained inline.
 */
export const createAuth = (ctx) =>
  betterAuth({
    // Set explicitly: never infer the site URL from request headers.
    baseURL: siteUrl,
    // Only our own site may call the auth endpoints from a browser (CSRF protection).
    trustedOrigins: [siteUrl],
    database: authComponent.adapter(ctx),

    // Discord is the only way in. Email/password is not enabled, so those endpoints are off.
    socialProviders: {
      discord: {
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        // Ask for the minimum: who you are + which servers you're in. No email, no "join servers".
        disableDefaultScope: true,
        scope: ["identify", "guilds"],
        // Better Auth requires an email on every user. We don't collect one, so store a
        // placeholder on the reserved `.invalid` domain (it can never receive mail).
        mapProfileToUser: (profile) => ({
          email: `${profile.id}@users.mbgeezzzz.invalid`,
          emailVerified: false,
          name: profile.global_name || profile.username,
        }),
      },
    },

    account: {
      // Discord access/refresh tokens are encrypted at rest with BETTER_AUTH_SECRET.
      encryptOAuthTokens: true,
      // One sign-in method, so linking other providers stays off.
      accountLinking: { enabled: false },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7, // sessions last 7 days
      updateAge: 60 * 60 * 24, // and are refreshed at most once a day while used
    },

    // Stored in Convex: in-memory counters would reset between function calls.
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/social": { window: 60, max: 10 },
        "/callback/*": { window: 60, max: 10 },
      },
    },

    advanced: {
      // Secure (HTTPS-only) cookies whenever the site runs on HTTPS.
      useSecureCookies: Boolean(siteUrl?.startsWith("https://")),
    },

    // Any auth error (forged callback, expired state, Discord "cancel") lands on the home page,
    // which shows a friendly "login didn't finish" notice. No error details are shown.
    onAPIError: { errorURL: `${siteUrl}/?auth=error` },

    plugins: [
      convex({
        authConfig,
        // What the signed Convex token (15 min) carries besides the user id, session id and times:
        // only the name and picture the dashboard shows, so pages don't have to read the user
        // record (one less database call per page). No email or other fields.
        jwt: { definePayload: ({ user }) => ({ name: user.name, image: user.image ?? null }) },
      }),
    ],
  });
