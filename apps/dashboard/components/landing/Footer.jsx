import { Logo } from "@/components/ui/Logo";
import { sectionGap } from "@/components/ui/Section";
import { site } from "@/lib/site";

const COLUMNS = [
  {
    title: "Developers",
    links: [
      { label: "Documentation", href: site.links.docs, soon: true },
      { label: "API reference", href: site.links.docs, soon: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: site.links.privacy },
      { label: "Terms of Service", href: site.links.terms },
      { label: "Refund Policy", href: site.links.refunds },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Support server", href: site.links.support },
      { label: "Add to Discord", href: site.links.invite },
    ],
  },
];

/** Site footer. `gapClass`: space above it (landing: sectionGap; dashboard: dashboardGap). */
export function Footer({ gapClass = sectionGap }) {
  return (
    <footer className={`${gapClass} border-t border-edge`}>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.6fr_repeat(3,minmax(0,1fr))]">
        <div>
          <Logo id="footer-logo" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted">A multi-purpose Discord bot with a web dashboard.</p>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-sm font-medium text-fg">{col.title}</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-muted transition hover:text-fg">
                    {link.label}
                  </a>
                  {link.soon ? <span className="ml-2 text-xs text-dim">soon</span> : null}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-edge">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-dim sm:px-6">
          <p>
            © {site.year} {site.name}. Not affiliated with Discord.
          </p>
          <p>Early access</p>
        </div>
      </div>
    </footer>
  );
}
