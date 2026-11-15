import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Code2, Hand, ListChecks, ShieldCheck, ToggleRight } from "lucide-react";
import { GuildIcon } from "@/components/dashboard/GuildIcon";
import { buttonClass } from "@/components/ui/Button";
import { getGuild } from "@/lib/guilds";
import { getCurrentUser } from "@/lib/session";
import { botInviteUrl, site } from "@/lib/site";

// Per-user and request-time: blocks on the server (no pre-rendered shell).
export const instant = false;

// The settings modules, in build order (AGENTS.md). Each gets its own page as it's built.
const MODULES = [
  { title: "Welcome & embeds", text: "Join and leave messages with a live preview.", Icon: Hand, phase: 1 },
  { title: "Button roles", text: "Let members pick their own roles.", Icon: ToggleRight, phase: 2 },
  { title: "Moderation & logging", text: "Cases, history and log channels.", Icon: ListChecks, phase: 3 },
  { title: "AutoMod", text: "Spam, links and raids, with a punishment ladder.", Icon: ShieldCheck, phase: 4 },
  { title: "Developers", text: "API keys and signed webhooks.", Icon: Code2, phase: 5 },
];

export default async function GuildPage({ params }) {
  await getCurrentUser();
  const { guildId } = await params;
  // Only servers this user may manage (checked in Convex). Anything else is a plain 404, so the
  // page never reveals whether a server exists.
  const guild = await getGuild(guildId);
  if (!guild) notFound();

  const invite = guild.botInstalled ? null : botInviteUrl(guild.id);

  return (
    <>
      <Link
        href="/dashboard"
        prefetch={false}
        className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-fg"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All servers
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <GuildIcon guild={guild} className="size-16 text-lg" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-[-0.03em] text-fg sm:text-3xl">{guild.name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-dim">
            <span className={`size-1.5 rounded-full ${guild.botInstalled ? "bg-ok" : "bg-white/20"}`} aria-hidden="true" />
            {guild.botInstalled ? "Bot active" : "Bot not added yet"}
            <span aria-hidden="true">·</span>
            {guild.owner ? "Owner" : "Manager"}
          </p>
        </div>
      </div>

      {invite ? (
        <div className="card mt-8 flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="font-medium text-fg">{site.name} isn&apos;t in this server yet</p>
            <p className="mt-1 text-sm text-muted">Add it to start using the settings below.</p>
          </div>
          <a href={invite} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "md")}>
            Add bot
          </a>
        </div>
      ) : null}

      <section aria-labelledby="modules-heading" className="mt-10">
        <h2 id="modules-heading" className="text-lg font-semibold text-fg">
          Settings
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map(({ title, text, Icon }) => (
            <li key={title} className="card p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-brand/15 text-brand-2">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] text-dim">Coming soon</span>
              </div>
              <p className="mt-4 font-medium text-fg">{title}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
