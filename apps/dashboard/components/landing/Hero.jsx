import { ArrowRight, Plus, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Accent, leadClass, sectionGapPad } from "@/components/ui/Section";
import { site } from "@/lib/site";
import { AVATARS, ChannelCard, DiscordButton, Mention, Message } from "./DiscordMock";

// Honest product facts (no invented usage numbers). Swap in real stats once the bot is live.
const FACTS = [
  { value: "<1s", label: "Config sync" },
  { value: "$0", label: "To get started" },
  { value: "60s", label: "Setup time" },
];

/** The bot at work in a channel. Decorative, fictional sample data. */
function HeroVisual() {
  return (
    // sm:pt-6 / sm:pb-5 make room for the floating badges, so the layout (and the gap to the
    // facts strip) is measured from their edges, not from the card underneath them
    <div aria-hidden="true" className="relative mx-auto w-full max-w-lg sm:pt-6 sm:pb-5 lg:max-w-none">
      {/* A second card peeking out behind, for depth */}
      <div className="absolute inset-x-8 -top-4 bottom-8 -rotate-3 rounded-2xl border border-edge bg-discord/60 sm:top-2 sm:bottom-13" />

      {/* From lg the card height comes from .hero-frame (matches the text column). Like in Discord,
          the newest messages stay at the bottom and older ones fade out at the top. */}
      <ChannelCard
        channel="general"
        topic="Hang out and chat"
        className="relative sm:p-6 lg:h-(--hero-card)"
        bodyClassName="flex min-h-0 flex-1 flex-col justify-end gap-5 overflow-hidden pt-5 [mask-image:linear-gradient(to_bottom,transparent,#000_1.25rem)]"
        footer={
          <div className="shrink-0">
            <div className="mt-5 flex items-center gap-3 rounded-lg bg-white/[0.04] px-4 py-3 text-sm text-dim">
              <Plus className="size-4" />
              Message #general
            </div>
            <p className="mt-2 flex items-center gap-2 pl-1 text-[11px] text-dim">
              <span className="flex gap-[3px]">
                <span className="size-1 rounded-full bg-muted motion-safe:animate-typing" />
                <span className="size-1 rounded-full bg-muted motion-safe:animate-typing motion-safe:[animation-delay:150ms]" />
                <span className="size-1 rounded-full bg-muted motion-safe:animate-typing motion-safe:[animation-delay:300ms]" />
              </span>
              <span>
                <span className="font-medium text-muted">kai</span> is typing…
              </span>
            </p>
          </div>
        }
      >
        {/* Messages come in one after another when the page loads */}
        <Message
          author="kai"
          avatar={AVATARS.kai}
          time="Today at 18:01"
          className="motion-safe:animate-rise motion-safe:[animation-delay:100ms]"
        >
          anyone up for game night later? 🎮
        </Message>
        <p className="flex items-center gap-2 pl-1 text-[11px] text-dim motion-safe:animate-rise motion-safe:[animation-delay:300ms]">
          <ShieldCheck className="size-3.5 text-brand-2" />1 message removed by AutoMod · scam link
        </p>
        <Message
          author="mira"
          avatar={AVATARS.mira}
          time="Today at 18:02"
          className="motion-safe:animate-rise motion-safe:[animation-delay:500ms]"
        >
          lol it caught that before I even saw it. count me in for tonight
        </Message>
        <p className="flex items-center gap-2 pl-1 text-xs text-dim motion-safe:animate-rise motion-safe:[animation-delay:700ms]">
          <ArrowRight className="size-3.5 text-ok" />
          <span className="font-medium text-fg">nova</span> joined the server
        </p>
        <Message
          bot
          blink
          avatarId="hero-bot-1"
          time="Today at 18:03"
          className="motion-safe:animate-rise motion-safe:[animation-delay:900ms]"
        >
          Welcome <Mention>@nova</Mention>! Grab your roles to get started 👋
          <span className="mt-2 flex flex-wrap gap-1.5">
            <DiscordButton primary>🔔 Events</DiscordButton>
            <DiscordButton>🎮 Gaming</DiscordButton>
            <DiscordButton>🎨 Art</DiscordButton>
          </span>
        </Message>
      </ChannelCard>

      <div className="absolute top-0 right-4 hidden items-center gap-2.5 rounded-xl border border-edge-strong bg-raise/95 px-3 py-2 shadow-xl backdrop-blur motion-safe:animate-float sm:flex">
        <span className="grid size-7 place-items-center rounded-lg bg-brand/15 text-brand-2">
          <ShieldCheck className="size-4" />
        </span>
        <span>
          <span className="block text-[11px] font-semibold text-fg">AutoMod blocked a raid</span>
          <span className="block text-[10px] text-dim">14 accounts · 0.3s</span>
        </span>
      </div>

      <div className="absolute bottom-0 left-4 hidden items-center gap-2 rounded-lg border border-edge-strong bg-raise/95 px-3 py-1.5 font-mono text-[10.5px] text-muted shadow-xl backdrop-blur motion-safe:animate-float motion-safe:[animation-delay:-3.5s] sm:flex">
        <span className="size-1.5 rounded-full bg-ok" />
        POST /hooks <span className="text-brand-2">member.joined</span> <span className="text-ok">200</span>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* Background: a soft violet diagonal plane behind the text, with a thin edge line that a
          light beam slowly travels down, plus one breathing glow behind the chat. Calm, one color. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* The plane's slanted edge runs through the gap between the text and the chat */}
        <div className="absolute inset-0 bg-linear-to-b from-brand/[0.09] via-brand/[0.035] to-transparent [clip-path:polygon(0_0,60%_0,40%_100%,0_100%)]" />
        {/* Line + beam only from lg: on stacked layouts the line would run through the text */}
        <svg className="absolute inset-0 hidden size-full lg:block" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            {/* Both fade out before the facts strip at the bottom */}
            <linearGradient id="hero-edge" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#a99dff" stopOpacity="0.35" />
              <stop offset="0.8" stopColor="#a99dff" stopOpacity="0" />
            </linearGradient>
            {/* The beam: a short bright stretch of gradient that slides down the line, fades out
                around 75% of the height (before the facts strip), then rests a moment */}
            <linearGradient id="hero-beam" x1="0" y1="-24" x2="0" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#c4baff" stopOpacity="0" />
              <stop offset="0.6" stopColor="#c4baff" stopOpacity="0">
                <animate
                  attributeName="stop-opacity"
                  values="0;0.9;0.9;0;0"
                  keyTimes="0;0.12;0.6;0.75;1"
                  dur="8s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="1" stopColor="#c4baff" stopOpacity="0" />
              <animate attributeName="y1" values="-24;60;60" keyTimes="0;0.75;1" dur="8s" repeatCount="indefinite" />
              <animate attributeName="y2" values="0;84;84" keyTimes="0;0.75;1" dur="8s" repeatCount="indefinite" />
            </linearGradient>
          </defs>
          <line x1="60" y1="0" x2="40" y2="100" stroke="url(#hero-edge)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          {/* Hidden (so not animated) when the visitor prefers reduced motion */}
          <line
            x1="60"
            y1="0"
            x2="40"
            y2="100"
            stroke="url(#hero-beam)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            className="hidden motion-safe:inline"
          />
        </svg>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-[-10%] h-[700px] w-[800px] rounded-full bg-[radial-gradient(closest-side,rgba(123,107,255,0.18),transparent)] motion-safe:animate-breathe"
      />

      {/* hero-frame (globals.css) centers the content in the first screen from lg. The bottom padding
          is exactly one sectionGap, the same gap as below the facts strip. min-h-svh + items-end keep
          the strip below the fold on stacked (tablet/phone) layouts too. */}
      <div className={`hero-frame relative mx-auto flex min-h-svh max-w-6xl items-end px-4 sm:px-6 ${sectionGapPad}`}>
        {/* 80px between text and preview; text gets a little more width so the headline keeps its lines */}
        <div className="grid w-full items-center gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          <div>
            <a
              href="#pricing"
              className="group inline-flex items-center gap-2 rounded-full border border-edge bg-white/[0.03] px-3 py-1 text-xs text-muted transition hover:text-fg"
            >
              {/* Dot sits inside the text span so the pill keeps its text baseline (the hero height math relies on it) */}
              <span className="font-medium text-brand-2">
                <span
                  className="mr-2 inline-block size-1.5 rounded-full bg-brand-2 align-middle motion-safe:animate-pulse-dot"
                  aria-hidden="true"
                />
                Early access
              </span>
              Free plan, no card needed
              <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" />
            </a>

            {/* Size comes from .hero-frame. Always 3 lines from lg (the hero height math relies on it). */}
            <h1 className="mt-6 text-(length:--hero-h1) leading-[1.04] font-semibold tracking-[-0.04em] text-balance">
              Run your Discord <br className="hidden lg:inline" />
              server from <br className="hidden lg:inline" />
              <Accent>one dashboard.</Accent>
            </h1>

            <p className={`mt-5 max-w-lg ${leadClass}`}>
              {site.name} welcomes new members, hands out roles and keeps spam out, while you set everything up from
              a clean web dashboard. No commands to memorize.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={site.links.invite}>Add to Discord</ButtonLink>
              <ButtonLink href={site.links.dashboard} variant="ghost">
                Open Web Dashboard
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
            </div>
            <p className="mt-4 text-xs text-dim">Free to start · Set up in under a minute</p>
          </div>

          <HeroVisual />
        </div>
      </div>

      {/* Slim facts strip */}
      <section aria-label="Product facts" className="relative border-y border-edge bg-white/[0.015]">
        <dl className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-edge px-4 sm:px-6">
          {FACTS.map((fact) => (
            <div key={fact.label} className="flex flex-col-reverse items-center gap-1 py-6">
              <dt className="text-xs text-dim sm:text-sm">{fact.label}</dt>
              <dd className="text-2xl font-semibold tracking-[-0.03em] text-fg sm:text-3xl">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </section>
  );
}
