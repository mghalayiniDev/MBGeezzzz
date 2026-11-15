// Small violet label above a section heading ("Features", "Pricing", ...)
export function SectionLabel({ children }) {
  return <p className="text-sm font-medium text-brand-2">{children}</p>;
}

// Violet gradient highlight for a word inside a heading. Same font as the heading.
export function Accent({ children, className = "" }) {
  return <span className={`text-gradient-brand ${className}`}>{children}</span>;
}

// Section heading size: scales with the screen, a bit larger on big screens (2xl, 1536px+).
export const headingClass =
  "text-[clamp(1.9rem,2.3vw_+_0.7rem,2.6rem)] leading-[1.1] font-semibold tracking-[-0.035em] text-balance 2xl:text-[2.9rem]";

// Body text next to headings.
export const leadClass = "text-[15px] leading-7 text-muted";

// Vertical space above each section (generous, so the page feels calm).
// ONE vertical rhythm for the whole page (the user wants every gap identical, and generous):
//   sectionGap: space ABOVE every block (sections, feature rows, summary card, footer).
//               Margin on top only and nothing at the bottom, so gaps never add up unevenly.
//   headerGap:  space between a section heading and that section's content.
export const sectionGap = "mt-32 lg:mt-48"; // 128px, 192px from lg
export const sectionGapStack = "space-y-32 lg:space-y-48"; // same gap between stacked children
// Same gap as padding, for the one place it has to sit inside a box: hero content → facts strip
export const sectionGapPad = "pb-32 lg:pb-48";
export const headerGap = "mt-14 lg:mt-20"; // 56px, 80px from lg
// Dashboard (denser than the landing page): space between its sections and above its footer.
export const dashboardGap = "mt-16 lg:mt-20"; // 64px, 80px from lg

// Put this (with the section's id) on the first element INSIDE a section, so menu links
// land on the heading instead of the empty space above it.
export const anchorClass = "scroll-mt-28";

export function SectionHeader({ label, title, aside, headingId }) {
  return (
    <div className="grid items-end gap-5 lg:grid-cols-[1fr_minmax(0,340px)]">
      <div>
        <SectionLabel>{label}</SectionLabel>
        <h2 id={headingId} className={`mt-3 ${headingClass}`}>
          {title}
        </h2>
      </div>
      {aside ? <div className={leadClass}>{aside}</div> : null}
    </div>
  );
}
