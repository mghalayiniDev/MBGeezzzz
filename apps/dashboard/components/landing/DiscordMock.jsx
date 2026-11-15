/* eslint-disable @next/next/no-img-element -- tiny pre-sized avatars in decorative mockups; plain <img> needs no image optimizer at runtime */
import { Hash, User } from "lucide-react";
import { LogoMark } from "@/components/ui/Logo";
import { site } from "@/lib/site";

// Small building blocks for Discord-style mockups on the landing page.
// Decorative only: fictional sample data, hidden from screen readers.

// Profile pictures for the fictional users. 128px self-hosted copies (no third-party requests) of
// Unsplash photos (Unsplash License: free to use, commercial use included, no attribution needed).
// Rule: never give a real person's photo to a "bad actor" in a mockup (scam/raid accounts get the
// default avatar instead).
export const AVATARS = {
  kai: "/mock/avatars/kai.webp", // images.unsplash.com/photo-1507003211169-0a1dd7228f2d
  mira: "/mock/avatars/mira.webp", // images.unsplash.com/photo-1534528741775-53994a69daeb
  luna: "/mock/avatars/luna.webp", // images.unsplash.com/photo-1514888286974-6c03e2ca1dba (a cat)
};

/** What Discord shows for accounts without a profile picture (generic, no Discord branding). */
function DefaultAvatar() {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#4e5058] text-white/85">
      <User className="size-5" strokeWidth={2.25} />
    </span>
  );
}

/** A channel: header, messages, and an optional `footer` (e.g. the message input bar). */
export function ChannelCard({ channel, topic, children, footer, className = "", bodyClassName = "mt-4 space-y-4" }) {
  return (
    <div
      aria-hidden="true"
      className={`flex flex-col rounded-2xl border border-edge bg-discord p-4 shadow-[0_30px_90px_-45px_rgba(123,107,255,0.45)] sm:p-5 ${className}`}
    >
      <p className="flex shrink-0 items-center gap-2 border-b border-edge pb-3 text-sm font-semibold text-fg">
        <Hash className="size-4 text-dim" />
        {channel}
        {topic ? (
          <span className="ml-1 truncate border-l border-edge pl-3 text-xs font-normal text-dim">{topic}</span>
        ) : null}
      </p>
      <div className={bodyClassName}>{children}</div>
      {footer}
    </div>
  );
}

/**
 * A chat message. `bot` uses the MBGeezzzz avatar (needs a unique `avatarId` per page; `blink`
 * makes it blink). Otherwise `avatar` is a photo URL (see AVATARS), or the default avatar if empty.
 */
export function Message({
  author,
  bot = false,
  avatarId,
  blink = false,
  avatar,
  time = "Today at 18:03",
  className = "",
  children,
}) {
  return (
    <div className={`flex gap-3 ${className}`}>
      {bot ? (
        <LogoMark id={avatarId} blink={blink} className="size-9 shrink-0" />
      ) : avatar ? (
        <img
          src={avatar}
          alt=""
          width={36}
          height={36}
          loading="lazy"
          decoding="async"
          className="size-9 shrink-0 rounded-full bg-white/10 object-cover"
        />
      ) : (
        <DefaultAvatar />
      )}
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="font-semibold text-fg">{bot ? site.name : author}</span>
          {bot ? <span className="rounded bg-brand px-1 py-px text-[9px] font-bold text-white">APP</span> : null}
          <span className="text-[11px] text-dim">{time}</span>
        </p>
        <div className="mt-1 text-[13px] leading-relaxed text-muted">{children}</div>
      </div>
    </div>
  );
}

/** An embed. `thumbnail` (photo URL) shows top right, like a welcome embed with the member's avatar. */
export function Embed({ children, color = "#7B6BFF", thumbnail }) {
  return (
    <div className="mt-2 flex gap-3 rounded-md border-l-4 bg-white/[0.04] p-3.5" style={{ borderLeftColor: color }}>
      <div className="min-w-0 flex-1">{children}</div>
      {thumbnail ? (
        <img
          src={thumbnail}
          alt=""
          width={56}
          height={56}
          loading="lazy"
          decoding="async"
          className="size-14 shrink-0 rounded-full bg-white/10 object-cover"
        />
      ) : null}
    </div>
  );
}

export function DiscordButton({ children, primary = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-medium ${
        primary ? "bg-brand text-white" : "bg-white/10 text-fg"
      }`}
    >
      {children}
    </span>
  );
}

export function Mention({ children }) {
  return <span className="rounded bg-brand/20 px-1 font-medium text-brand-2">{children}</span>;
}
