"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { site } from "@/lib/site";

/**
 * Phone menu: a button that opens a full-width sheet under the navbar with the page links and the
 * account buttons (which are not in the phone navbar itself). Closes on click outside, Esc or a link.
 */
export function MobileMenu({ links }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    // Not `relative` on purpose: the sheet positions itself against the fixed header (full width)
    <div ref={ref} className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="grid size-10 place-items-center rounded-xl border border-edge bg-white/[0.03] text-muted transition hover:text-fg"
      >
        {open ? <X className="size-[18px]" aria-hidden="true" /> : <Menu className="size-[18px]" aria-hidden="true" />}
      </button>

      {open ? (
        // Sits behind the navbar row (-z-10) and starts at the top, so the bar looks solid while it's open
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-0 -z-10 border-b border-edge bg-ink pt-18 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)]"
        >
          <div className="px-4 pb-6 sm:px-6">
            <ul className="divide-y divide-edge border-t border-edge">
              {links.map((link) => {
                // Separate pages (Status) get an "opens elsewhere" arrow instead of the plain one.
                const Icon = link.separatePage ? ArrowUpRight : ArrowRight;
                return (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      onClick={close}
                      {...(link.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="flex items-center justify-between py-4 text-[15px] font-medium text-muted transition hover:text-fg"
                    >
                      <span>
                        {link.label}
                        {link.newTab ? <span className="sr-only"> (opens in a new tab)</span> : null}
                      </span>
                      <Icon className="size-4 text-dim" aria-hidden="true" />
                    </a>
                  </li>
                );
              })}
            </ul>

            {/* Logged out (default) */}
            <div className="mt-5 grid gap-2.5 signed-in:hidden">
              <ButtonLink href={site.links.invite}>Add to Discord</ButtonLink>
              <ButtonLink href={site.links.login} variant="ghost">
                Log in with Discord
              </ButtonLink>
            </div>
            {/* Signed in (hint cookie set) */}
            <div className="mt-5 hidden signed-in:grid">
              <ButtonLink href={site.links.dashboard}>
                Your servers
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
