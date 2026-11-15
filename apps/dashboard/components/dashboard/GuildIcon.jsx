/* eslint-disable @next/next/no-img-element -- Discord CDN icons are already sized (?size=128); no image optimizer needed */

/** Like Discord: the first letter of each word, at most 3 ("Pixel Labs" -> "PL"). */
function initials(name) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => Array.from(word)[0])
    .join("");
  return Array.from(letters).slice(0, 3).join("") || "?";
}

/** A server's icon from Discord's CDN, or its initials when it has none. Decorative (the name is shown next to it). */
export function GuildIcon({ guild, className = "size-12 text-sm" }) {
  if (guild.icon) {
    return (
      <img
        src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.webp?size=128`}
        alt=""
        width={64}
        height={64}
        loading="lazy"
        decoding="async"
        className={`${className} shrink-0 rounded-2xl bg-white/[0.06] object-cover`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`${className} grid shrink-0 place-items-center rounded-2xl border border-edge bg-white/[0.04] font-semibold text-muted`}
    >
      {initials(guild.name)}
    </span>
  );
}
