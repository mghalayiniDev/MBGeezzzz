import { GettingStarted } from "@/components/dashboard/GettingStarted";
import { ServerPicker } from "@/components/dashboard/ServerPicker";
import { SectionLabel } from "@/components/ui/Section";
import { getMyGuilds } from "@/lib/guilds";
import { getCurrentUser } from "@/lib/session";

// Per-user and request-time: blocks on the server (no pre-rendered shell).
export const instant = false;

export default async function DashboardPage() {
  // Auth first (served from React's per-request cache: the layout made the same call). Layouts and
  // pages render in parallel, so the page never relies on the layout having checked already.
  const me = await getCurrentUser();
  const { guilds, refreshedAt, error } = await getMyGuilds();

  return (
    <>
      <SectionLabel>Dashboard</SectionLabel>
      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-fg sm:text-4xl">
        Welcome back, <span className="text-gradient-brand">{me.name}</span>
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted">Pick a server to set up the bot.</p>

      <ServerPicker guilds={guilds} refreshedAt={refreshedAt} error={error} />
      <GettingStarted guilds={guilds} />
    </>
  );
}
