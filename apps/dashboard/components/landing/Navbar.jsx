import { ArrowRight, ArrowUpRight, ChevronDown, PartyPopper, ShieldCheck, Webhook } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { site } from "@/lib/site";
import { MobileMenu } from "./MobileMenu";
import { NavUser } from "./NavUser";
import { ScrollHeader } from "./ScrollHeader";

const FEATURE_LINKS = [
  { href: "#feature-welcome", title: "Welcome & roles", text: "Greet new members, hand out roles", Icon: PartyPopper },
  { href: "#feature-moderation", title: "Moderation & AutoMod", text: "Keep spam, scams and raids out", Icon: ShieldCheck },
  { href: "#feature-developers", title: "For developers", text: "Public API and signed webhooks", Icon: Webhook },
];

// The status page is its own page (likely its own site later): it gets an "opens elsewhere"
// arrow, and opens in a new tab once it's a full URL to another site.
const statusOpensNewTab = /^https?:\/\//.test(site.links.status);
const newTabProps = statusOpensNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {};

const MOBILE_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Status", href: site.links.status, separatePage: true, newTab: statusOpensNewTab },
];

const linkClass = "text-sm font-medium text-muted transition-colors hover:text-fg";

/** "Features" with a dropdown that opens on hover or keyboard focus (pure CSS, no JS). */
function FeaturesMenu() {
  return (
    <li className="group/features relative">
      <a href="#features" className={`${linkClass} flex items-center gap-1 py-2`}>
        Features
        <ChevronDown
          className="size-3.5 text-dim transition group-focus-within/features:rotate-180 group-hover/features:rotate-180"
          aria-hidden="true"
        />
      </a>
      <div className="invisible absolute top-full -left-4 w-80 pt-2 opacity-0 transition duration-150 group-focus-within/features:visible group-focus-within/features:opacity-100 group-hover/features:visible group-hover/features:opacity-100">
        <div className="rounded-2xl border border-edge-strong bg-raise p-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)]">
          <ul>
            {FEATURE_LINKS.map(({ href, title, text, Icon }) => (
              <li key={href}>
                <a href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.04]">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand-2">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-fg">{title}</span>
                    <span className="block text-xs text-dim">{text}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#features"
            className="mt-1 flex items-center justify-between rounded-xl border-t border-edge px-3 pt-3 pb-1.5 text-xs text-muted transition-colors hover:text-fg"
          >
            See all features
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </li>
  );
}

export function Navbar() {
  return (
    <ScrollHeader>
      {/* Transparent over the hero; solid with a thin bottom line once you scroll */}
      <div className="border-b border-transparent transition-colors duration-300 group-data-[scrolled=true]:border-white/[0.07] group-data-[scrolled=true]:bg-ink/85 group-data-[scrolled=true]:backdrop-blur-xl">
        {/* h-18 (72px): keep --nav-h in globals.css (.hero-frame) in sync */}
        <nav aria-label="Main" className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          {/* Logo → links 48px, between links 36px */}
          <div className="flex items-center gap-12">
            <a href="#top" aria-label={`${site.name} home`} className="flex items-center rounded-lg">
              <Logo id="nav-logo" />
            </a>
            <ul className="hidden items-center gap-9 md:flex">
              <FeaturesMenu />
              <li>
                <a href="#pricing" className={linkClass}>
                  Pricing
                </a>
              </li>
              <li>
                <a href={site.links.status} className={`${linkClass} group/status inline-flex items-center gap-1`} {...newTabProps}>
                  Status
                  <ArrowUpRight
                    className="size-3.5 text-dim transition group-hover/status:-translate-y-px group-hover/status:translate-x-px group-hover/status:text-fg"
                    aria-hidden="true"
                  />
                  {statusOpensNewTab ? <span className="sr-only">(opens in a new tab)</span> : null}
                </a>
              </li>
            </ul>
          </div>

          {/* Phones: logo, avatar (signed in) and the menu button only; everything else is in the menu */}
          <div className="flex min-w-0 items-center justify-end gap-3">
            {/* Logged out (default). Hidden before paint when the "signed in" hint is set. */}
            <div className="hidden md:block">
              {/* gap-7 (28px): same as between the user and "Your servers" when signed in */}
              <div className="flex items-center gap-7 signed-in:hidden">
                <a href={site.links.login} className={linkClass}>
                  Log in
                </a>
                <ButtonLink href={site.links.invite} size="sm">
                  Add to Discord
                </ButtonLink>
              </div>
            </div>
            <NavUser />
            <MobileMenu links={MOBILE_LINKS} />
          </div>
        </nav>
      </div>
    </ScrollHeader>
  );
}
