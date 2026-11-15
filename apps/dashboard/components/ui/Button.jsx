const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl text-sm font-semibold whitespace-nowrap transition duration-150 select-none";

// Primary: on hover a soft sheen sweeps across once (the ::before stripe); it snaps back
// invisibly on mouse-out. Off for "reduce motion".
const shine =
  "relative overflow-hidden before:pointer-events-none before:absolute before:inset-y-0 before:-left-1/2 before:w-1/3 before:-skew-x-12 before:bg-white/25 before:opacity-0 before:blur-sm motion-safe:hover:before:left-[130%] motion-safe:hover:before:opacity-100 motion-safe:hover:before:transition-[left,opacity] motion-safe:hover:before:duration-700";

const variants = {
  primary: `bg-linear-to-b from-[#9081ff] to-[#6555f2] text-white shadow-[0_10px_30px_-8px_rgba(123,107,255,0.75),inset_0_1px_0_rgba(255,255,255,0.25)] hover:brightness-110 active:brightness-95 ${shine}`,
  ghost:
    "border border-edge-strong bg-white/[0.03] text-fg hover:bg-white/[0.07] hover:border-white/20",
};

const sizes = {
  sm: "h-9 px-3.5",
  md: "h-10 px-4 2xl:h-11 2xl:px-5",
};

export function buttonClass(variant = "primary", size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function ButtonLink({ href, variant = "primary", size = "md", className = "", children, ...rest }) {
  return (
    <a href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </a>
  );
}
