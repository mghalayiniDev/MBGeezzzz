// One-time setup of the auth environment variables on your Convex deployment.
//   SITE_URL            -> http://localhost:3000 (or pass another URL as the first argument)
//   BETTER_AUTH_SECRET  -> a strong random secret, generated here and NEVER printed.
//                          Kept if it already exists (changing it would log everyone out).
// Discord's Client ID and Secret are set by you (see AGENTS.md "Auth").
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// The Convex CLI entry file (the package doesn't export it, so point at it directly).
const convexCli = fileURLToPath(new URL("../node_modules/convex/bin/main.js", import.meta.url));
const cwd = fileURLToPath(new URL("../packages/convex/", import.meta.url));
const siteUrl = process.argv[2] || "http://localhost:3000";

// Only ever configure a HOSTED deployment.
const envFile = `${cwd}.env.local`;
const deployment = existsSync(envFile)
  ? readFileSync(envFile, "utf8").match(/^CONVEX_DEPLOYMENT=([^\s#]+)/m)?.[1]
  : undefined;
if (!deployment || !/^(dev|prod):/.test(deployment)) {
  console.error("packages/convex isn't connected to your hosted Convex deployment. Run, in packages/convex:");
  console.error("  npx convex dev --configure existing     (pick your hosted project)");
  console.error("Then run this again.");
  process.exit(1);
}

// Runs the Convex CLI directly with Node (no shell), so nothing is interpreted or logged by a shell.
const convex = (args, options = {}) => execFileSync(process.execPath, [convexCli, ...args], { cwd, encoding: "utf8", ...options });

const existing = convex(["env", "list"], { stdio: ["ignore", "pipe", "pipe"] });
const hasSecret = existing.split(/\r?\n/).some((line) => line.startsWith("BETTER_AUTH_SECRET"));

convex(["env", "set", "SITE_URL", siteUrl], { stdio: "inherit" });

if (hasSecret) {
  console.log("BETTER_AUTH_SECRET already set, keeping it.");
} else {
  convex(["env", "set", "BETTER_AUTH_SECRET", randomBytes(32).toString("base64")], { stdio: ["ignore", "ignore", "inherit"] });
  console.log("BETTER_AUTH_SECRET set (random, not shown).");
}

console.log("\nNext: set your Discord app credentials (type them in your terminal, not in a chat):");
console.log("  cd packages/convex");
console.log("  npx convex env set DISCORD_CLIENT_ID <client id>");
console.log("  npx convex env set DISCORD_CLIENT_SECRET <client secret>");
