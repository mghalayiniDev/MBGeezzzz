import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { SectionHeader, anchorClass, headerGap, leadClass, sectionGap, sectionGapStack } from "@/components/ui/Section";
import { site } from "@/lib/site";
import { AVATARS, ChannelCard, DiscordButton, Embed, Mention, Message } from "./DiscordMock";

/* ---------- Mockups (sample data only) ---------- */

function WelcomeMock() {
  return (
    <ChannelCard channel="welcome">
      <p className="flex items-center gap-2 pl-1 text-xs text-dim">
        <ArrowRight className="size-3.5 text-ok" />
        <span className="font-medium text-fg">kai</span> joined the server
      </p>
      <Message bot avatarId="showcase-welcome">
        <Embed thumbnail={AVATARS.kai}>
          <p className="text-sm font-semibold text-fg">Welcome to Pixel Labs!</p>
          <p className="mt-1">
            Hey <Mention>@kai</Mention>, you&apos;re member <span className="font-semibold text-fg">#12,804</span>. Say hi in
            #general, then pick what you&apos;re into.
          </p>
        </Embed>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <DiscordButton>🎮 Gaming</DiscordButton>
          <DiscordButton primary>🔔 Events</DiscordButton>
          <DiscordButton>🎨 Art</DiscordButton>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-dim">
          <Check className="size-3 text-ok" strokeWidth={3} />
          Only you can see this · You now have the Events role
        </p>
      </Message>
    </ChannelCard>
  );
}

function ModerationMock() {
  return (
    <ChannelCard channel="general">
      {/* Fresh raid account: default avatar, never a real photo */}
      <Message author="raid_acc_07" time="Today at 21:14">
        <span className="text-dim line-through">free nitro here → disc0rd-gift.xyz @everyone</span>
        <span className="mt-1 flex items-center gap-1.5 text-[11px] text-dim">
          <ShieldCheck className="size-3.5 text-brand-2" />
          Removed by AutoMod · suspicious link
        </span>
      </Message>
      <Message bot avatarId="showcase-mod" time="Today at 21:14">
        <Embed color="#F87171">
          <p className="text-xs font-semibold text-fg">Case #482 · Timeout</p>
          <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <div>
              <dt className="font-semibold text-fg">User</dt>
              <dd>raid_acc_07</dd>
            </div>
            <div>
              <dt className="font-semibold text-fg">Duration</dt>
              <dd>10 minutes</dd>
            </div>
            <div>
              <dt className="font-semibold text-fg">Strikes</dt>
              <dd>3 / 3</dd>
            </div>
          </dl>
        </Embed>
      </Message>
      <Message author="luna" avatar={AVATARS.luna} time="Today at 21:15">
        wow that was fast, ty 🙏
      </Message>
    </ChannelCard>
  );
}

const TERMINAL = [
  { kind: "code", text: 'await fetch(`${API}/guilds/8124/members/4410/roles`, {' },
  { kind: "code", text: '  method: "POST", body: \'{"roleId":"customer"}\' })' },
  { kind: "ok", label: "202", text: "role queued" },
  { kind: "ok", label: "bot", text: 'gave @kai the "Customer" role' },
  { kind: "ok", label: "hook", text: "role.added → your-app.com/hooks · signed" },
];

function DeveloperMock() {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-edge bg-panel shadow-[0_30px_90px_-45px_rgba(123,107,255,0.45)]"
    >
      <div className="flex items-center gap-1.5 border-b border-edge px-4 py-3">
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="ml-2 font-mono text-[11px] text-dim">your-app.js</span>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[11.5px] leading-6">
        <code>
          {TERMINAL.map((line, i) => (
            <span key={i} className="block">
              {line.kind === "code" ? <span className="text-muted">{line.text}</span> : null}
              {line.kind === "ok" ? (
                <>
                  <span className="text-ok">✓ </span>
                  <span className="inline-block w-11 text-brand-2">{line.label}</span>
                  <span className="text-muted">{line.text}</span>
                </>
              ) : null}
              {/* Blinking caret after the last line */}
              {i === TERMINAL.length - 1 ? (
                <span className="ml-1 inline-block h-3.5 w-[7px] translate-y-0.5 bg-brand-2/80 motion-safe:animate-blink" />
              ) : null}
            </span>
          ))}
        </code>
      </pre>
      <div className="space-y-1.5 border-t border-edge p-4">
        {[
          ["member.joined", "kai.dev", "now"],
          ["automod.triggered", "raid_acc_07", "4s"],
        ].map(([event, who, age], i) => (
          <div key={event} className="flex items-center justify-between gap-3 rounded-lg border border-edge bg-white/[0.02] px-3 py-2 text-xs">
            <span className="flex min-w-0 items-center gap-3">
              {/* Live dot on the newest delivery */}
              <span
                className={`size-1.5 shrink-0 rounded-full ${i === 0 ? "bg-ok motion-safe:animate-pulse-dot" : "bg-white/15"}`}
              />
              <span className="shrink-0 font-mono text-[10.5px] text-brand-2">{event}</span>
              <span className="truncate text-muted">{who}</span>
            </span>
            <span className="shrink-0 font-mono text-[10px] text-dim">{age}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Rows ---------- */

const ROWS = [
  {
    id: "feature-welcome",
    index: "01",
    label: "Welcome & roles",
    title: "Make every new member feel at home.",
    text: "Greet people with a message you design, then let them pick their own roles in one click. No commands to learn.",
    chips: ["Welcome messages", "Leave messages", "Button roles", "DM greeting"],
    Mock: WelcomeMock,
  },
  {
    id: "feature-moderation",
    index: "02",
    label: "Moderation & AutoMod",
    title: "Stay safe without babysitting.",
    text: "AutoMod removes spam, scam links and raids as they happen. Every action gets a case number, so your team always knows what happened.",
    chips: ["AutoMod", "Raid protection", "Cases & history", "Log channels"],
    Mock: ModerationMock,
  },
  {
    id: "feature-developers",
    index: "03",
    label: "For developers",
    title: "Connect your server to your app.",
    text: "Give a role when someone buys, announce when you ship, show your leaderboard on your site. One API key, and every event comes back as a signed webhook.",
    chips: ["Public API", "Signed webhooks", "Delivery logs", "API keys"],
    Mock: DeveloperMock,
  },
];

function Row({ id, index, label, title, text, chips, Mock, flip }) {
  return (
    // grid-cols-1 (minmax(0, 1fr)) lets the column shrink on phones, so wide code scrolls inside its box.
    // The id lets the navbar's Features menu jump straight to this row.
    <div id={id} className="grid scroll-mt-28 grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-20">
      <div className={flip ? "lg:order-2" : ""}>
        <p className="flex items-center gap-2.5 text-xs font-medium tracking-[0.14em] text-dim uppercase">
          <span className="rounded-md bg-brand/15 px-1.5 py-0.5 font-mono text-[10px] tracking-normal text-brand-2">{index}</span>
          {label}
        </p>
        <h3 className="mt-4 text-[length:clamp(1.7rem,1.8vw_+_0.9rem,2.4rem)] leading-[1.1] font-semibold tracking-[-0.035em] text-balance">
          {title}
        </h3>
        <p className={`mt-4 max-w-md ${leadClass}`}>{text}</p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <li key={chip} className="rounded-lg border border-edge bg-white/[0.03] px-2.5 py-1 text-xs text-muted">
              {chip}
            </li>
          ))}
        </ul>
      </div>
      <div className={flip ? "lg:order-1" : ""}>
        {/* Rises in as it scrolls into view (inner wrapper, so the row's measured box never moves) */}
        <div className="reveal">
          <Mock />
        </div>
      </div>
    </div>
  );
}

/* ---------- Everything included ---------- */

const EVERYTHING = [
  "Welcome messages",
  "Leave messages",
  "Embed builder",
  "Button roles",
  "Moderation commands",
  "Cases & history",
  "AutoMod",
  "Raid protection",
  "Spam & link filters",
  "Log channels",
  "Analytics",
  "Settings undo",
  "Public API",
  "Signed webhooks",
  "Delivery logs",
  { label: "Leveling", soon: true },
  { label: "Leaderboards", soon: true },
];

function Everything() {
  return (
    <div className={`${sectionGap} rounded-3xl border border-edge bg-panel/60 px-6 py-12 text-center sm:px-10`}>
      <h3 className="text-2xl font-semibold tracking-[-0.03em] text-fg sm:text-3xl">One bot. One dashboard.</h3>
      <p className="mt-2 text-sm text-muted">Everything {site.name} does, switched on or off in a click.</p>
      <ul className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-2">
        {EVERYTHING.map((item) => {
          const { label, soon } = typeof item === "string" ? { label: item, soon: false } : item;
          return (
            <li
              key={label}
              className="flex items-center gap-1.5 rounded-lg border border-edge bg-white/[0.03] px-3 py-1.5 text-xs text-muted"
            >
              <Check className="size-3 text-brand-2" strokeWidth={3} aria-hidden="true" />
              {label}
              {soon ? <span className="ml-0.5 rounded bg-white/[0.07] px-1 text-[10px] text-dim">soon</span> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Showcase() {
  return (
    <section aria-labelledby="features-heading" className={`mx-auto max-w-6xl px-4 sm:px-6 ${sectionGap}`}>
      <div id="features" className={anchorClass} />
      <SectionHeader
        headingId="features-heading"
        label="Features"
        title={
          <>
            Everything you need,
            <br />
            nothing you don&apos;t.
          </>
        }
        aside="The three things every community needs, done properly. All set up from the dashboard."
      />
      <div className={`${headerGap} ${sectionGapStack}`}>
        {ROWS.map((row, i) => (
          <Row key={row.index} {...row} flip={i % 2 === 1} />
        ))}
      </div>
      <Everything />
    </section>
  );
}
