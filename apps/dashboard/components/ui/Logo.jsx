import { site } from "@/lib/site";

/**
 * The bot's avatar and logo mark: a friendly robot face in a violet circle (Discord shows bot
 * avatars as circles, so the logo and the avatar are the same picture). Same art as app/icon.svg
 * and public/brand/mbgeezzzz-avatar.svg (keep them in sync).
 * `id` must be unique per use on a page, because SVG gradient IDs are global.
 * `blink`: the eyes blink every few seconds (decorative, off for "reduce motion").
 */
export function LogoMark({ id = "logo", className = "size-8", blink = false }) {
  const bg = `${id}-bg`;
  const shine = `${id}-shine`;
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={bg} x1="10" y1="4" x2="54" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#a294ff" />
          <stop offset="1" stopColor="#5a48e6" />
        </linearGradient>
        <radialGradient id={shine} cx="20" cy="10" r="36" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill={`url(#${bg})`} />
      <circle cx="32" cy="32" r="32" fill={`url(#${shine})`} />
      {/* Antenna */}
      <path d="M32 23v-4" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="16.5" r="3" fill="#fff" />
      {/* Ears, head and visor */}
      <rect x="11" y="33.5" width="4" height="9" rx="2" fill="#fff" fillOpacity="0.85" />
      <rect x="49" y="33.5" width="4" height="9" rx="2" fill="#fff" fillOpacity="0.85" />
      <rect x="15" y="23.5" width="34" height="27" rx="10" fill="#fff" />
      <rect x="19.5" y="29" width="25" height="14" rx="7" fill="#1e1748" />
      {/* Eyes */}
      <g
        fill="#b4a9ff"
        className={blink ? "origin-center [transform-box:fill-box] motion-safe:animate-blink-eyes" : undefined}
      >
        <rect x="24" y="32.5" width="5" height="7" rx="2.5" />
        <rect x="35" y="32.5" width="5" height="7" rx="2.5" />
      </g>
    </svg>
  );
}

export function Logo({ id, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark id={id} className="size-8" />
      <span className="text-[15px] font-semibold tracking-tight text-fg">{site.name}</span>
    </span>
  );
}
