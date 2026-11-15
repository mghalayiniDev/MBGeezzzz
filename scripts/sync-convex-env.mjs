// Keeps every folder pointed at the same HOSTED Convex deployment.
// Source of truth: packages/convex/.env.local (written by `npx convex dev` in packages/convex).
//
//   apps/dashboard/.env.local  <- NEXT_PUBLIC_CONVEX_URL, NEXT_PUBLIC_CONVEX_SITE_URL (public),
//                                 CONVEX_DEPLOYMENT (so `npx convex dev` works from this folder)
//   .env.local (repo root)     <- CONVEX_DEPLOYMENT (so `npx convex dev` works from the root)
//
// `convex.json` in the root and in apps/dashboard points the CLI at packages/convex/convex,
// so running `npx convex dev` from any of the three folders deploys the same code.
// Only the deployment name and public URLs are copied. Nothing secret is read or written.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const path = (p) => fileURLToPath(new URL(p, import.meta.url));
const SOURCE = path("../packages/convex/.env.local");
const DASHBOARD = path("../apps/dashboard/.env.local");
const ROOT = path("../.env.local");
const log = (msg) => console.log(`[sync-convex-env] ${msg}`);

function parseEnv(text) {
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*([^#\s]*)/);
    if (match) values[match[1]] = match[2];
  }
  return values;
}

/** Sets KEY=value lines in an env file, keeping everything else (comments included). */
function upsertEnv(file, wanted) {
  const lines = existsSync(file) ? readFileSync(file, "utf8").split(/\r?\n/) : [];
  for (const [key, value] of Object.entries(wanted)) {
    const index = lines.findIndex((line) => line.startsWith(`${key}=`));
    if (index >= 0) lines[index] = `${key}=${value}`;
    else lines.push(`${key}=${value}`);
  }
  writeFileSync(file, `${lines.join("\n").replace(/^\n+/, "").replace(/\n+$/, "")}\n`);
}

if (!existsSync(SOURCE)) {
  log("packages/convex/.env.local not found. Run `npx convex dev` in packages/convex first.");
  process.exit(0);
}

const source = parseEnv(readFileSync(SOURCE, "utf8"));
const deployment = source.CONVEX_DEPLOYMENT;
if (!deployment || !deployment.startsWith("dev:") && !deployment.startsWith("prod:")) {
  log("packages/convex isn't connected to a hosted Convex deployment, so nothing was synced.");
  log("Run `npx convex dev --configure existing` in packages/convex and pick your hosted project.");
  process.exit(0);
}

const convexUrl = source.CONVEX_URL;
const siteUrl = source.CONVEX_SITE_URL || convexUrl?.replace(/\.convex\.cloud$/, ".convex.site");
if (!convexUrl?.startsWith("https://") || !siteUrl?.startsWith("https://")) {
  log("Hosted Convex URLs missing in packages/convex/.env.local, so nothing was synced.");
  process.exit(0);
}

upsertEnv(DASHBOARD, {
  NEXT_PUBLIC_CONVEX_URL: convexUrl,
  NEXT_PUBLIC_CONVEX_SITE_URL: siteUrl,
  CONVEX_DEPLOYMENT: deployment,
});
if (!parseEnv(readFileSync(DASHBOARD, "utf8")).SITE_URL) upsertEnv(DASHBOARD, { SITE_URL: "http://localhost:3000" });
upsertEnv(ROOT, { CONVEX_DEPLOYMENT: deployment });

log(`all folders use ${convexUrl}`);
