# AGENTS.md

**Bot name: MBGeezzzz** (four z's). A multi-purpose Discord bot.

Portfolio project: a full-stack Discord bot. Server admins log into a web dashboard and configure everything the bot does.
It has a free tier and a **paid premium plan (Paddle)**.

**Positioning:** *"A Discord bot you can program."* Besides the usual modules, developers can control the bot through a public API and receive server events through signed webhooks.

**Priorities, in order:** 1) secure, 2) cheap (stay on free tiers), 3) fast.
Keep things simple. Don't add services or dependencies without a clear reason.

---

## Stack

- **Plain JavaScript only (ES modules). No TypeScript.** JSDoc comments for editor hints are fine.
- **Bot:** discord.js v14, run directly with `node` (no build step).
- **Dashboard:** Next.js (App Router, `.js`/`.jsx`) + Tailwind.
- **Database, caching, rate limiting, crons:** Convex. **No Redis** unless we hit a real limit.
- **Auth:** Discord-only login via **Better Auth** through Convex's official component (`@convex-dev/better-auth`). Chosen over Convex Auth, which is still beta. See "Auth (done)" below.
- **Payments:** Paddle Billing (build against Paddle Sandbox first).
- **Hosting (later):** bot on Oracle Cloud Always Free. Dashboard **not on Vercel Hobby** (it forbids commercial use). See "Hosting notes" at the bottom.

## Planned layout (adjust when scaffolding)

```
apps/bot/          discord.js bot
apps/dashboard/    Next.js dashboard
packages/convex/   Convex schema + functions (used by both)
```

Monorepo with **npm workspaces** (root `package.json`). `npm run dev:web` runs the site.

**Convex: hosted only, never a local deployment** (user's choice). The backend code lives in **`packages/convex/convex`** (the only Convex functions folder). `npx convex dev` works from the **root, `apps/dashboard` or `packages/convex`**: each has a `CONVEX_DEPLOYMENT` (hosted `dev:` deployment) in `.env.local`, and the root and dashboard have a `convex.json` pointing at `packages/convex/convex`, so every folder deploys the same code to the same deployment. Source of truth: `packages/convex/.env.local`; `scripts/sync-convex-env.mjs` copies the deployment name and public URLs to the other folders (runs automatically before `npm run dev` in the dashboard, or `npm run sync:env`). The hosted backend runs on its own; `npx convex dev` is only needed while changing backend code. `npm run setup:convex-env` sets `SITE_URL` + a random `BETTER_AUTH_SECRET` on the deployment (never prints the secret). **Before editing Convex code, read `packages/convex/convex/_generated/ai/guidelines.md`** (Convex AI files are installed in `packages/convex`). Never create another `convex/` folder elsewhere.
`packages/convex` exports the generated API as `@mbgeezzzz/convex/api`. Convex functions are plain JS too.
The landing page lives in the same Next.js app as the dashboard (`apps/dashboard`, route `/`).

**Next.js 16.4 note:** this version has breaking changes. Read `node_modules/next/dist/docs/` before writing Next.js code (see `apps/dashboard/AGENTS.md`). `cacheComponents` and `partialPrefetching` are on; the landing page uses `export const ensureStatic = "navigation"` so it stays fully static.

## How it fits together

```
Dashboard (Next.js) ──auth + rate limits──► Convex ◄──live subscription── Bot (discord.js)
                                              ▲                           └─ keeps configs in memory
Paddle ──signed webhooks──────────────────────┤
Developers ──public API (API keys)────────────┘
```

- Dashboard writes settings to Convex.
- Bot subscribes to each server's config (including its plan) and gets changes pushed instantly. No restart, no polling.

---

## Auth (done)

**Flow (no login page):** every login button links to `/auth/discord` (route handler) → it asks Better Auth for the Discord URL and redirects there → Discord → `/api/auth/callback/discord` → session cookie → `/dashboard`. Any auth error → `/?auth=error` (landing shows a notice).

**Files:**
- `packages/convex/convex/auth.js`: Better Auth config (all security settings, commented). `http.js` serves `/api/auth/*`.
- `packages/convex/convex/lib/auth.js`: `requireUser(ctx)` / `getSessionUser(ctx)`. **Every Convex function that needs a user calls it first** (`requireGuildAdmin` builds on it). Identity comes from the signed Convex token, then ONE read checks the session still exists (logout cuts access immediately). The token carries only `name` + `image` (`jwt.definePayload` in `auth.js`), so no user-record read is needed. Don't use `authComponent.getAuthUser` (an extra read per call).
- `packages/convex/convex/users.js`: `me` returns only `{ name, image }`. Never return emails, IDs or tokens to the client.
- `apps/dashboard/app/api/auth/[...all]/route.js`: forwards to Convex. `app/auth/discord/route.js`: starts login.
- `apps/dashboard/lib/session.js`: `getCurrentUser()`, the only way server code gets the user (verifies with Convex, redirects to login if invalid). Call it inside a `<Suspense>` boundary (Cache Components).
- `apps/dashboard/proxy.js`: access control (below).

**Security settings (keep them):**
- Scopes **`identify` + `guilds` only** (no email). Better Auth needs an email, so users get `<discordId>@users.mbgeezzzz.invalid` (reserved domain, can't receive mail).
- Discord tokens **encrypted at rest** (`encryptOAuthTokens`) and only used server-side (needed to load the user's server list). Account linking off.
- Sessions: 7 days, refreshed daily. Cookies HttpOnly, SameSite=Lax, Secure + `__Secure-` prefix on HTTPS.
- `baseURL` and `trustedOrigins` come from `SITE_URL`, never request headers. The login route redirects only to discord.com and the post-login destination is fixed (no open redirect). OAuth `state` is checked on the callback.
- **`/auth/discord` only starts a login on real page navigations** (`Sec-Fetch-Mode: navigate`, no `RSC`/`Next-Router-Prefetch` header); background requests get an empty 204. Otherwise link prefetches redirected there by `proxy.js` would create OAuth states and use up the 10/min login limit. Links into `/dashboard` pages use `prefetch={false}` (each prefetch costs a session check).
- Rate limits stored in Convex (in-memory wouldn't persist): 60 req/min per IP overall, 10/min for starting login and for callbacks.
- Known limitation: Better Auth's Discord provider doesn't send PKCE. `state` + the server-side client secret protect the flow.

**Signed-in navbar on the static landing page:** `proxy.js` keeps a readable hint cookie `mbg_signed_in=1` (no personal data, grants nothing) in sync with the session cookie. An inline script in `app/layout.js` sets `<html data-signed-in>` before paint, the `signed-in:` Tailwind variant swaps the navbar, and `NavUser` fetches `{ name, image }` from `/api/me` only when the hint is set (logged-out visitors make no extra requests). The landing page stays fully static.

**`proxy.js` = deny by default.** `PUBLIC_PAGES` (`/`) and `PUBLIC_PREFIXES` (`/api/auth/`, `/auth/`) are open. Anything else → 404 when logged out, other `/api/*` → 401. **A new public page must be added to `PUBLIC_PAGES`.**

**`/dashboard` has three locks (never remove any):**
1. `proxy.js` requires the session cookie **and** a verified session for every `PROTECTED_PAGES` request. Fast path: the signed Convex token (`better-auth.convex_jwt`, HttpOnly, 15 min) is verified locally with `jose` against Convex's public keys (`/api/auth/convex/jwks`, cached), checking issuer, audience `convex` and algorithm: **0 Convex calls**. A bad signature/malformed token is rejected without calling Convex. Only a missing or expired token falls back to Better Auth's `get-session` (1 call), whose fresh token cookie is passed to the page and the browser. Failures get a real 307 to `/auth/discord` before anything renders. **Fails closed**: any error = no access. `lib/auth-server.js` has `jwtCache` on, so pages reuse that token instead of fetching a new one. Typical dashboard page load = **1 Convex call**: `guilds.context` returns the user AND their saved server list, and `lib/session.js` (`getDashboardContext`, React `cache`) shares it between the layout and the page. Pages add their own query only for module data.
2. `app/dashboard/layout.js` awaits `getCurrentUser()` before rendering (`export const instant = false`, no pre-rendered shell), so the route is fully dynamic.
3. Every Convex function checks the user (`requireUser`).
Dashboard responses send `Cache-Control: private, no-store` and `X-Robots-Tag: noindex` (`next.config.mjs`). Open dashboard tabs run `SessionWatcher` (in the dashboard layout): on focus, on becoming visible and every 30s it pings `/api/session` (answered by `proxy.js` from the cookie alone, no Convex call) and replaces the page with `/` the moment the session cookie is gone. New signed-in pages go under `/dashboard` (or get added to `PROTECTED_PAGES`).

**Verification builds:** build with `NEXT_DIST_DIR=.next-verify` so it never touches the running dev server's `.next/dev` cache.

**Environment:** Convex env vars (set with `npx convex env set`, never in files): `SITE_URL`, `BETTER_AUTH_SECRET`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`. Next.js `.env.local`: `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL`, `SITE_URL`, `NEXT_PUBLIC_DISCORD_CLIENT_ID` (public; builds the "Add bot" invite links in `lib/site.js`) (see `.env.example` files). Discord redirect URL: `<SITE_URL>/api/auth/callback/discord`.

**Before production:** HTTPS `SITE_URL`, add the production redirect URL in Discord, and behind Cloudflare set Better Auth `advanced.ipAddress.ipAddressHeaders: ["cf-connecting-ip"]` so rate limits can't be dodged with a fake `x-forwarded-for`. Use a fresh `BETTER_AUTH_SECRET` for the production deployment (`npm run setup:convex-env` against it). When the dashboard gets a live Convex client, add `wss://*.convex.cloud` to the CSP `connect-src`.

---

## Rule #1: never call Convex per Discord event

Convex bills by function calls and data read or sent. The bot must **not** hit Convex on every message or join.

- Bot loads configs into memory at startup (`Map<guildId, config>`). The Convex subscription keeps them fresh.
- One subscription **per server**, not one giant query (a change re-sends the whole query result).
- Store config as **one document per server per module** (welcome, automod, leveling...).
- On startup: load configs with one paginated query, then subscribe gradually (don't open thousands at once).
- Discord servers never talk to Convex directly. Everything goes through the bot, so Convex sees **one client** sending a batched mutation every few seconds, no matter how many servers.
- Worst case (flushing every 10s nonstop) is about 260k calls a month, which fits the free tier at portfolio scale. Free-tier limits change, so check Convex's current pricing.

## When to write to Convex

| Data | Strategy |
|---|---|
| Frequent, OK to lose a little (XP, message counts, stats) | Buffer in memory, flush every 30–60s |
| Rare but important (mod cases, bans, automod actions) | Small queue, flush within ~5–10s or at 50 items, retry on failure |
| Full logs (message edits/deletes, joins/leaves) | **Discord log channel only.** Don't store in Convex |

Flush rules:
- One queue shared by the whole bot, not one per server.
- **Skip empty flushes** (no data = no call).
- Split big flushes into chunks of about 200 items per mutation.
- If Convex fails, put the items back in the queue and retry later.
- Flush on `SIGTERM` before exiting.

## Convex rules

- Every query uses `.withIndex(...)`. Never `.filter()` over a big table.
- Paginate long lists in the dashboard (cases, audit log, events).
- Prefer queries and mutations over actions.
- Avoid "hot" documents that everything writes to (e.g. one global counter). Use per-server or per-hour docs instead.
- Cleanup is a **daily** Convex cron. It deletes in chunks of 500 and reschedules itself if more remain.
- Bot timers (spam-tracker cleanup, flushes) are `setInterval` **in the bot**, not Convex crons.

---

## Automod

**Split the work:**
- **Discord's built-in AutoMod** handles keyword lists, invite blocking, and mention spam. The dashboard saves the rules and the bot syncs them to Discord through the API. Discord enforces them at zero cost to us.
- Discord's AutoMod has per-server limits on rules and keywords, so **our bot** handles the rest in memory: message-rate spam, duplicate messages, link allowlists, escalating punishments.

**Per-message checks (all in memory):**
1. Ignore bots and webhooks, servers with automod off, and exempt roles. Exit early.
2. Run cheapest checks first: mentions → links → words → spam.
3. Clean message → done, 0 DB calls.
4. Violation → punish, log to Discord, queue one event for Convex.

**Rules:**
- **No raw user-written regex** (it can freeze the bot). Treat banned words as plain text and escape them, or use the `re2` package. Cap pattern count and length.
- Build matchers when the config changes, not on every message.
- Spam tracking: a `Map` of recent message timestamps per `guildId:userId` (sliding window). A `setInterval` removes old entries every minute so it doesn't grow forever.
- **Auto-escalate:** e.g. timeout after 3 violations in 1 minute. This stops spammers at the source.
- Delete in bulk with `channel.bulkDelete(ids)`, collecting IDs for about a second.
- Log channel: **one grouped embed per server every few seconds** ("@user: spam ×37"), not one per violation.

**Storing automod events in Convex:**
- **Combine repeats:** one row per `guildId:userId:rule` per flush, with a `count`.
- **Per-server cap:** about 100 detailed events per server per hour. Beyond that, only counters go up (also stops one server from burning our free tier on purpose).
- **Hourly stats table** (`guildId, hour, rule, count`) for dashboard charts.
- Store only a short content snippet (≤200 chars), never the full message. Add a short privacy note on the dashboard explaining this (Discord's developer policy expects care with message content).
- Retention: detailed events 7 days, hourly stats 90 days.

---

## Developer platform (the standout feature)

**1. Public API with API keys.** Admins create keys in the dashboard and call the bot from their own code.
Example uses: "someone bought my product → give them the Customer role", "new blog post → announce it", "show my leaderboard on my website".

**2. Outgoing webhooks.** The bot sends server events to the developer's URL, Stripe-style:
`member.joined`, `mod.case_created`, `automod.triggered`, `level.up`, `role.added`.

**3. Developer tools in the dashboard:**
- Webhook delivery logs (status, response code, "Resend" button).
- "Send test event" button.
- API usage chart per key.
- Embed builder export: copy an embed as JSON or discord.js code.

**How it runs (cheap):**
- Public API = Convex HTTP actions. They check the key, scopes, and rate limit.
- Write requests (e.g. "add role") are **queued in Convex**. The bot picks them up through a subscription and runs them. **The bot token stays on the bot server only.**
- **All outgoing webhooks are sent by the bot** (outgoing traffic from Oracle is effectively free). Events that start in the dashboard are queued in Convex and the bot sends them too, so all outgoing HTTP goes through one place with one SSRF guard.
- Delivery logs are batched into Convex like automod events, with a per-server cap and short retention (7 days).

**Optional extras for developer communities (cheap):**
- GitHub code previews: someone pastes `.../file.js#L10-L20`, the bot replies with that code block (cache results).
- GitHub release announcements as formatted embeds.

---

## Premium and billing (Paddle)

**Model: charge per server.** A user buys premium, then **assigns it to a server they manage** (checked with `requireGuildAdmin`). A subscription's quantity = how many servers it can be assigned to.

**How the bot knows a server is paid:**

```
Paddle ─signed webhook─► Convex HTTP action (verify signature)
                             └─► internal mutation: update `subscriptions`
                                    └─► recompute `guildPlans` for assigned servers
                                           └─► bot's existing config subscription
                                               pushes the new plan → bot memory
```

**Tables (sketch):**
- `subscriptions`: `userId, paddleSubscriptionId, paddleCustomerId, status, quantity, currentPeriodEnd, graceUntil, lastEventAt`
- `premiumAssignments`: `subscriptionId, userId, guildId, assignedAt`
- `guildPlans`: `guildId, plan ("free" | "premium"), expiresAt`. **Derived data, only written by internal functions.**
- `paddleEvents`: `eventId, processedAt` (for idempotency, 30-day retention)

**Where limits are enforced:**
- **Convex mutations are the real gatekeeper.** E.g. creating a 4th role menu on the free plan is rejected server-side. The dashboard only hides or greys out buttons for UX.
- One helper, `getPlan(ctx, guildId)`, used by every mutation that has a plan limit. Built in Phase 0, even before Paddle exists (everyone is "free" until then).
- Bot checks the plan from memory for bot-side premium features, and also treats `expiresAt < now` as free (backup in case an update is missed).

**Billing security rules:**
- **Premium status only ever changes through a verified Paddle webhook.** No public mutation can touch `subscriptions` or `guildPlans`.
- Verify the `Paddle-Signature` header: HMAC-SHA256 of `ts:rawBody` with the webhook secret, using the **raw body** before parsing. Constant-time compare. Reject timestamps older than about 5 minutes (replay protection).
- **Idempotency:** store each Paddle `event_id`. If it's already processed, return 200 and do nothing.
- **Out-of-order events:** compare the event's `occurred_at` with `lastEventAt` and ignore older events.
- **Create checkouts server-side:** an authenticated Convex action creates the Paddle transaction with `custom_data: { userId }` taken from auth, and the dashboard opens Paddle.js with that transaction ID. Never trust a user ID or server ID typed into the browser.
- `past_due` (payment failed) → grace period of about 3 days, then downgrade. Use `ctx.scheduler.runAt(graceUntil, ...)` to downgrade at the right time (queries don't re-run on their own as time passes).
- Refund or chargeback events → revoke premium.
- Reassigning premium to another server: cooldown of about 7 days (stops rotating one subscription across many servers).
- **Downgrade = freeze, don't delete.** Extra role menus, webhooks, etc. become inactive, and come back if they resubscribe.
- Daily reconciliation cron: check active subscriptions against the Paddle API to fix any missed webhooks.
- Paddle API key and webhook secret live only in Convex environment variables. Separate sandbox and live keys. The bot never talks to Paddle.
- Link to Paddle's customer portal for cancelling and updating the payment method.

**Plans: only two, Free and Pro** ("premium" in code = the Pro plan). Pro is **$8/month per server, 20% off yearly** ($6.40/month billed yearly). Prices are set in `apps/dashboard/lib/site.js`. The landing page shows them as a Free vs Pro comparison table.

**What's in Pro.** Rule: charge for things that cost us more or that power users need. **Never charge for safety:** moderation and automod basics stay free. The pricing section on the landing page lists these exact limits, so keep them in sync.

| | Free | Pro |
|---|---|---|
| Welcome, moderation, logging, automod basics | ✅ | ✅ |
| Button role menus | 3 | Unlimited |
| Automod punishment ladder | Basic | Custom |
| Public API | Read-only, small daily quota | Read + write, high quota |
| Outgoing webhooks | — | ✅ |
| Settings version history / undo | Last 3 changes | Full history |
| Analytics history | 7 days | 90 days |

**Paddle requirements before going live:** Paddle reviews the account. Need a live website with a pricing page, Terms of Service, Privacy Policy, and Refund Policy, and probably our own domain (about $10/year).

---

## Bot performance

- Enable only the intents a feature actually needs. `MessageContent` (needed for word filters) is a privileged intent and must be turned on in the Discord Developer Portal.
- Limit caches with `Options.cacheWithLimits` (no presences/reactions; about 50 messages per channel so deleted-message logs still have content) and use sweepers. Target memory use: roughly 80–150 MB.
- `allowedMentions: { parse: [] }` on the client. The bot can never ping @everyone or roles by accident.
- Slash commands only. **Register them from a deploy script, never on startup.**
- `deferReply()` for anything slower than about 1 second.
- Command cooldowns live in memory.

---

## Security

### Dashboard and Convex
- **`requireGuildAdmin(ctx, guildId)` runs at the start of every dashboard query and mutation** (`convex/lib/auth.js`). It checks the `guildAccess` table: only the servers a user can manage (owner, Administrator or Manage Server), never all their servers. Built by `guilds.refresh` (Convex action: Better Auth gives it the user's Discord token server-side, it calls `/users/@me/guilds`, rate-limited per user with `@convex-dev/rate-limiter`). `lib/guilds.js` refreshes when the saved list is older than 5 minutes (list page AND `/dashboard/[guildId]`), so a normal page load is 1 Convex call. **Refreshes are on demand, never polling:** only when someone opens the dashboard (or returns to its tab) with a 5+ minute old list; users who aren't on the dashboard cost nothing. A refresh is **~5 function calls** (the action, `startRefresh` + its session read, Better Auth's token read with the cached Discord account id, `saveAccess`). Capped per user at 1 per 15 s and 60/day, stored in the user's `guildListSyncs` doc (no rate-limiter component calls), so a scripted user can't burn the free tier. **Mutations that change a server's settings use `requireGuildAdminForWrite`**: it also refuses when the user's saved list is older than 10 minutes (`ServerListStale` → dashboard refreshes, then retries once), so lost Manage Server can't linger. Bot phase: on `guildDelete` (server deleted, or bot removed), a bot-only mutation deletes the `botGuilds` row, and for a deleted server also every `guildAccess` row for it (add a `by_guildId` index then). **Why stored, not fetched live:** queries/mutations can't call Discord, so permission checks on every save need a local copy; a Discord refresh costs ~5 function calls versus 0 extra for reading the saved list (it comes with the page's context call), and Discord rate-limits that endpoint hard. Lost access is removed on the next refresh.
- **Never trust `guildId` or `userId` sent from the browser.** Get the user from auth and check access.
- Every function declares argument validators (`v.string()`, etc.). **Never use `v.any()`.**
- Enforce length limits and Discord's embed limits (title 256, description 4096, 25 fields, 6000 total).
- Check that channel and role IDs actually belong to that server.
- **Role escalation:** auto-roles, button roles, and API role actions must **reject** roles with dangerous permissions (Administrator, Manage Server, Manage Roles, Ban/Kick Members, etc.) and any role above the bot's highest role.
- Rate-limit dashboard mutations per user with `@convex-dev/rate-limiter` (e.g. about 30 saves/min). Also rate-limit login attempts and server-list refreshes.
- **Audit log** every settings change: who, what, when, old → new value.
- Discord access tokens are stored only because the server list needs them, encrypted at rest. Never send them to the client.
- Security headers in `next.config.mjs` (CSP, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, HSTS in production). Done. The CSP uses **no nonces** on purpose (nonces force per-request rendering). When adding Convex and Paddle, extend `connect-src` / `script-src` / `frame-src` for their domains.
- No secrets in `NEXT_PUBLIC_*` variables.
- Put Cloudflare's free plan in front of the dashboard.

### Bot ↔ Convex
- Functions only the bot should call require a `BOT_SECRET` (constant-time compare), or are HTTP actions with a bearer token.
- The config queries the bot subscribes to are protected the same way.
- Server-only logic uses Convex `internal` functions.

### Bot
- Check both the user's and the bot's permissions on every command.
- Moderation respects role order: no acting on someone at or above your own role, or the bot's.
- In-memory rate limits: per user, per server, and global.
- Sanitize user-defined content (custom commands, welcome messages).

### Developer platform
- **API keys:** random, shown **only once**, stored as a **hash** only. Recognizable prefix (`mbg_live_`) so leaks are easy to spot. Each key belongs to one server and has scopes (`roles:write`, `cases:read`, ...). Can be revoked. Show "last used".
- **Rate limit per key**, plus monthly quotas per plan.
- **SSRF protection for webhook URLs:** HTTPS only. Resolve DNS and **block private/internal IPs** (localhost, `10.x`, `192.168.x`, `169.254.x` (cloud metadata), etc.). No redirects. 5-second timeout. Cap response size.
- **Sign outgoing webhooks:** HMAC-SHA256 with a per-endpoint secret plus a timestamp header, so receivers can reject forgeries and replays.
- **Retries:** exponential backoff, up to 5 attempts. After repeated failures, **automatically disable** the endpoint and notify the admin.
- API role actions go through the same role-escalation check.

### Billing
- See "Billing security rules" in the Premium section.

### General
- Secrets in `.env`, never committed. On the server: `chmod 600`.
- Commit the lockfile, enable Dependabot, run an audit in CI. Turn on GitHub secret scanning.
- If the bot token ever leaks, reset it immediately.

---

## Shard-ready (no sharding work now)

Sharding is only required at about 2,500 servers. Follow these habits so it's a setting change later, not a rewrite:

- Client uses `shards: "auto"`.
- All in-memory bot state is keyed by `guildId`.
- Never read other servers from `client.guilds.cache` for cross-server features. Use Convex.
- Store bot stats per shard (`shardId`) and add them up in the dashboard.
- Scheduled jobs: Convex decides **when**, and only the shard that owns the server sends.
  `shardId = Number(BigInt(guildId) >> 22n) % totalShards`

When it becomes real work: up to about 10k servers, `shards: "auto"` handles it in one process. Beyond that (or if memory gets high), split into processes with discord.js `ShardingManager`. At very large scale, replace per-server config subscriptions with one "configs changed since X" feed.

---

## Feature plan

### Build order

| Phase | What |
|---|---|
| — | ✅ **Landing page** (done, redesigned 2026-11-13 from the second `design.png`, drawn as "Warden" and rebranded). The inline embed editor (`apps/dashboard/components/embed-builder/InlineEmbedEditor.jsx`, click text inside the message to edit, plus `EmbedToolbar`) is no longer on the landing page; it's kept for the dashboard's welcome-message builder (Phase 1). See "Landing page rules" below. |
| 0 | **Foundation:** ✅ Discord login (see "Auth (done)"), ✅ server picker (`/dashboard`: servers with Manage Server, "Add bot" invite with the server preselected, `/dashboard/[guildId]` behind `requireGuildAdmin`; `botGuilds` is filled by the bot later), settings framework (one doc per module), live config sync, audit log, rate limiter, bot status page (server count, uptime, commands used, latency), **`getPlan()` helper + plan limits** |
| 1 | **Welcome + embed builder** (the embed builder is reused by every later module) |
| 2 | **Button roles** |
| 3 | **Moderation + logging** (automod needs these first) |
| 4 | **Automod** |
| 5 | **Developer platform** (API keys, public API, outgoing webhooks, delivery logs) |
| 6 | **Paddle billing**, pricing page, legal pages |
| 7 | Leveling, analytics charts, GitHub code previews |

### Landing page rules

- **Design: simple, calm, uncrowded.** One accent color (violet) on a dark background. No grid backgrounds, no multicolor badges, no italic accent fonts, generous spacing. Hero background: one soft violet diagonal plane behind the text (edge from 60% of the width at the top to 40% at the bottom), with a thin edge line (a light beam slowly travels down it; line + beam from `lg` only) and one breathing glow behind the chat. The user tried a line anchored to the gap between text and chat and rejected it: keep this version. **Motion is subtle and CSS-only, always behind `motion-safe:`** (messages rise in on load, badges float, "is typing" dots); keyframes live in the `@theme` block of `globals.css`. **Keep it to these sections** (the user wants fewer sections than typical bot sites): hero (text left, live `#general` chat mockup right, facts strip below) → features (`Showcase.jsx`: 3 alternating text/Discord-mockup rows, then the "One bot. One dashboard." chip summary) → pricing table → "Ready when your server is" card with the getting-started checklist (`ReadyCta.jsx`; the user prefers it over a full-width band) → footer. **No "Try it"/demo section** (the user removed it). Navbar: full-width bar, 72px tall (`h-18`; keep `--nav-h` in `.hero-frame` in sync), transparent over the hero and solid with a thin bottom line on scroll; links next to the logo (Features dropdown, Pricing, Status; 48px after the logo, 36px between links), "Log in" + "Add to Discord" on the right (signed in: avatar + name from `lg` as an account-menu button with "Signed in as", "Your servers" and "Log out", then the "Your servers" button; both groups 28px apart). Every log-out button uses `lib/sign-out.js` (Better Auth sign-out, clears the hint cookie, full reload to `/`). Note: Better Auth only accepts sign-out from `SITE_URL`'s origin, so testing it on another port returns 403 "Invalid origin" (expected). **Phones: only logo, avatar (signed in) and the menu button** (the user found it crowded); everything else is in the full-width menu sheet (`MobileMenu.jsx`). The Status link has an "opens elsewhere" ↗ icon and opens in a new tab once `site.links.status` is a full URL to another site; it points nowhere until the status page exists (Phase 0). The user rejected a floating "pill" navbar. Discord-style mockups use the pieces in `components/landing/DiscordMock.jsx`. Layout ideas may come from other bot sites, but never copy their text, branding or exact design.
- **Spacing must be identical everywhere, to the pixel (the user cares a lot).** Use only the shared values in `components/ui/Section.jsx`: `sectionGap` (top margin above every block: sections, feature rows, summary card, footer = 192px from `lg`, 128px below) or `sectionGapStack` for stacked children, and `headerGap` (heading → content = 80px / 56px). The one exception to "top margin" is the hero: its content sits exactly `sectionGapPad` (same 192/128px, as bottom padding) above the facts strip, so the strip has the same gap above and below it. From `lg` the `hero-frame` utility (`globals.css`) also centers the content in the first screen and keeps the strip below the fold. That math needs the content height, so: the headline is always 3 lines from `lg`, the rest of the text column is a fixed 258px (262px from 2xl), and the chat card is sized to match the text column. **If the hero text changes, re-measure that 258px.** The hero's floating badges are inside its layout box (padding), so gaps are measured from their edges. The **dashboard** is denser: it uses `dashboardGap` (64px, 80px from `lg`) between its sections and above its footer (the site `Footer` with `gapClass={dashboardGap}`, in `app/dashboard/layout.js`). Dashboard home = welcome → server picker → "Getting started" (real progress from the user's data + help links). Never add other bottom padding/margins to sections, and never hand-pick another gap. After layout changes, measure the gaps in the browser.
- **No fake numbers or social proof.** No invented server counts, uptime, GitHub stars, "trusted by" logos, testimonials or "X of 100 claimed" counters. The stats bar shows true product facts until the bot is live, then real numbers from Convex.
- **The repo is private.** Don't mention GitHub, open source, or self-hosting anywhere on the site.
- Mockups (hero dashboard, feature cards) use clearly fictional sample data ("Pixel Labs") and are `aria-hidden`. Fictional users have profile pictures (`AVATARS` in `DiscordMock.jsx`): small self-hosted copies of Unsplash photos in `public/mock/avatars` (no third-party requests). **Never give a real person's photo to a bad actor** (scam/raid accounts use the default avatar).
- **Brand mark = bot avatar:** a robot face in a violet circle (`LogoMark` in `components/ui/Logo.jsx`), also `app/icon.svg` and `public/brand/mbgeezzzz-avatar.svg` + `.png` (1024px, square, for the Discord Developer Portal). Keep the four in sync.
- All links and prices live in `apps/dashboard/lib/site.js`. Links marked TODO there point nowhere yet (login, dashboard, docs, legal pages, support server).
- Paddle needs real Privacy, Terms and Refund pages before launch (Phase 6).

### v1 scope per module

| Module | v1 | Later / skip |
|---|---|---|
| **Welcome** | Join and leave messages, embed builder with live preview, `{user}` `{server}` `{memberCount}` variables, optional DM, "Send test" button, export as JSON / discord.js code | Image welcome cards (CPU-heavy) |
| **Button roles** | Buttons or dropdown menu, toggle on/off, "pick only one" mode, role-escalation guard | Reaction-emoji roles (outdated) |
| **Moderation** | `/warn` `/timeout` `/kick` `/ban` `/unban` `/purge` `/case` `/history`, required reasons, case list in the dashboard with editable reasons, live mod feed | Appeals system |
| **Logging** | Turn each event type on/off (edits/deletes, joins/leaves, role changes), choose a channel per category, ignore certain channels | — |
| **Automod** | Sync rules to Discord's AutoMod, spam/duplicate/link checks in the bot, **punishment ladder set in the dashboard** (e.g. 3 strikes → 10-min timeout, 5 → kick) | — |
| **Developer platform** | API keys with scopes, public API, outgoing webhooks, delivery logs, test events, usage chart | — |
| **Leveling** | XP with a **60-second cooldown per user** (stops farming and cuts writes), role rewards, level-up message, no-XP channels/roles, `/rank`, public leaderboard (Next.js ISR) | Image rank cards |

### Standout features
- **Settings undo / version history:** the audit log already stores old → new values, so add a "Restore this version" button.
- **Live Discord-style preview** wherever admins edit a message.
- **Analytics charts:** automod activity, member joins/leaves, commands used (from the hourly stats tables).

### Maybe later
- Custom commands created in the dashboard.
- Tickets with transcripts viewable in the dashboard.
- Scheduled announcements (Convex scheduler; the owning shard sends).
- "Who's editing" indicator on settings pages.

### Don't build
- **Music:** heavy CPU and bandwidth, against YouTube's terms, breaks often.
- **AI chat:** ongoing API costs.
- **Image generation** (rank cards, welcome images): CPU-heavy.
- **Economy / mini-games:** lots of work, shows no new skill.

---

## Portfolio extras

- README with an architecture diagram, a demo GIF, and a note that it's built to be shard-ready.
- Docker Compose to run the bot and dashboard with one command.
- Tests for command handlers and Convex functions (especially billing webhooks and permission checks). CI on GitHub Actions.

---

## Hosting notes (later, not now)

**Bot on Oracle Cloud Always Free:**
- Shape: Ampere A1 (ARM), Ubuntu 24.04. 1 OCPU / 6 GB is plenty. Save the SSH private key (it can't be downloaded again).
- "Out of host capacity" errors are common: retry later or try another availability domain.
- Oracle may reclaim Always Free instances that stay mostly idle. Upgrading to Pay As You Go avoids this (Always Free resources stay free). Set a budget alert (e.g. $1).
- The bot needs no inbound traffic: only open port 22 (optionally only to our own IP). SSH keys only (`PasswordAuthentication no`), plus `fail2ban` and `unattended-upgrades`.
- Run as a normal user, not root. Node.js LTS via nvm or NodeSource. Keep it running with systemd or pm2 (auto-restart on crash or reboot).
- Deploy: `git pull` → restart. Later: a GitHub Action that deploys over SSH on push to `main`.

**Dashboard:** the bot is paid, so this is commercial use and **Vercel Hobby is not allowed**. Free options:
- Cloudflare (Next.js through OpenNext; the free plan allows commercial use), or
- the same Oracle server, behind Cloudflare. Then also open ports 80/443, ideally only to Cloudflare's IP ranges.

Check that every free tier we use allows commercial use (Convex included).
