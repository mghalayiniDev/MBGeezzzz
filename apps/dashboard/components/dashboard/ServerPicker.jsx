"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Info, RotateCw, Search, Server } from "lucide-react";
import { refreshServers } from "@/app/dashboard/actions";
import { buttonClass } from "@/components/ui/Button";
import { isServerListStale } from "@/lib/server-list";
import { botInviteUrl, site } from "@/lib/site";
import { GuildIcon } from "./GuildIcon";

// Shown above the list when the latest refresh didn't work (the saved list is still shown).
const NOTICES = {
  rate_limited: "Too many refreshes for now. Showing your saved list. Try again a bit later.",
  reauth_required: "Your Discord login expired, so we couldn't read your servers.",
  discord_unavailable: "Discord didn't respond. Showing your last saved list.",
  failed: "Something went wrong while refreshing. Please try again.",
};

const SEARCH_FROM = 7; // show the search box only when the list is long enough to need it
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function formatAgo(ms) {
  const minutes = Math.floor(Math.max(0, ms) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.floor(hours / 24), "day");
}

/** "Synced with Discord 2 minutes ago", kept up to date while the tab is open. */
function SyncedAgo({ at }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  if (!at) return null;
  return (
    <span className="text-xs text-dim" suppressHydrationWarning>
      Synced with Discord {formatAgo(now - at)}
    </span>
  );
}

function Notice({ code }) {
  return (
    <div role="status" className="mt-6 flex items-start gap-3 rounded-xl border border-warn/25 bg-warn/[0.06] px-4 py-3 text-sm">
      <Info className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" />
      <p className="text-muted">
        {NOTICES[code] ?? NOTICES.failed}
        {code === "reauth_required" ? (
          <>
            {" "}
            <a href={site.links.login} className="font-medium text-fg underline underline-offset-2 hover:text-brand-2">
              Log in again
            </a>
          </>
        ) : null}
      </p>
    </div>
  );
}

function ServerCard({ guild }) {
  const invite = guild.botInstalled ? null : botInviteUrl(guild.id);
  return (
    // The server name is a link stretched over the whole card; "Add bot" sits above it.
    <li className="card relative flex items-center gap-4 p-4 transition-colors hover:border-edge-strong has-[a:focus-visible]:border-brand/60">
      <GuildIcon guild={guild} />
      <div className="min-w-0 flex-1">
        {/* No prefetch: each prefetch costs a session check (and a Convex call once the 15-minute
            token expires); the page loads on click instead. */}
        <Link
          href={`/dashboard/${guild.id}`}
          prefetch={false}
          className="block truncate font-medium text-fg outline-none after:absolute after:inset-0 after:rounded-[inherit]"
        >
          {guild.name}
        </Link>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-dim">
          <span className={`size-1.5 rounded-full ${guild.botInstalled ? "bg-ok" : "bg-white/20"}`} aria-hidden="true" />
          {guild.botInstalled ? "Bot active" : "Bot not added"}
          <span aria-hidden="true">·</span>
          {guild.owner ? "Owner" : "Manager"}
        </p>
      </div>
      {guild.botInstalled ? (
        <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-brand-2" aria-hidden="true">
          Manage
          <ArrowRight className="size-4" />
        </span>
      ) : invite ? (
        <a
          href={invite}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("primary", "sm", "relative z-10")}
          aria-label={`Add ${site.name} to ${guild.name}`}
        >
          Add bot
        </a>
      ) : null}
    </li>
  );
}

function EmptyState() {
  return (
    <div className="card mt-6 px-6 py-12 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-edge bg-white/[0.03] text-brand-2">
        <Server className="size-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-semibold text-fg">No servers to manage yet</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        You need to own a server or have the Manage Server permission in it. Create a server in Discord, or ask an
        admin for that permission, then refresh.
      </p>
    </div>
  );
}

/** The user's manageable servers. `error` = why the latest automatic refresh failed (or null). */
export function ServerPicker({ guilds, refreshedAt, error }) {
  const [query, setQuery] = useState("");
  const [actionError, setActionError] = useState(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? guilds.filter((guild) => guild.name.toLowerCase().includes(q)) : guilds;
  }, [guilds, query]);

  const busy = useRef(false);
  const onRefresh = () => {
    if (busy.current) return;
    busy.current = true;
    startTransition(async () => {
      const result = await refreshServers();
      busy.current = false;
      setActionError(result.ok ? null : result.error);
    });
  };

  const notice = actionError ?? error;

  // Coming back to an open tab (e.g. after deleting or leaving a server in Discord): refresh
  // automatically if the list is older than 5 minutes. Fresh lists cost nothing; Convex also
  // rate-limits refreshes per user. Not while the Discord login is expired: that can only be
  // fixed by logging in again, so retrying would just waste calls.
  const latest = useRef({ refreshedAt, onRefresh, notice });
  useEffect(() => {
    latest.current = { refreshedAt, onRefresh, notice };
  });
  useEffect(() => {
    const onVisible = () => {
      const { refreshedAt: at, onRefresh: refreshNow, notice: current } = latest.current;
      if (document.visibilityState === "visible" && current !== "reauth_required" && isServerListStale(at)) {
        refreshNow();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return (
    <section aria-labelledby="servers-heading" className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="servers-heading" className="text-lg font-semibold text-fg">
            Your servers
          </h2>
          <p className="mt-1 text-sm text-muted">Servers where you&apos;re the owner or have Manage Server.</p>
        </div>
        <div className="flex items-center gap-4">
          <SyncedAgo at={refreshedAt} />
          <button type="button" onClick={onRefresh} disabled={pending} className={buttonClass("ghost", "sm", "disabled:opacity-60")}>
            <RotateCw className={`size-4 ${pending ? "animate-spin" : ""}`} aria-hidden="true" />
            {pending ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {notice ? <Notice code={notice} /> : null}

      {guilds.length >= SEARCH_FROM ? (
        <label className="mt-6 flex h-10 items-center gap-2.5 rounded-xl border border-edge bg-white/[0.03] px-3.5 text-sm focus-within:border-brand/60 sm:max-w-xs">
          <Search className="size-4 shrink-0 text-dim" aria-hidden="true" />
          <span className="sr-only">Search servers</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search servers"
            maxLength={100}
            className="w-full bg-transparent text-fg outline-none placeholder:text-dim"
          />
        </label>
      ) : null}

      {guilds.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No servers match &ldquo;{query.trim()}&rdquo;.</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((guild) => (
            <ServerCard key={guild.id} guild={guild} />
          ))}
        </ul>
      )}
    </section>
  );
}
