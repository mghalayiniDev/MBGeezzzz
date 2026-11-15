import { ArrowRight, Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { headingClass, leadClass, sectionGap } from "@/components/ui/Section";
import { site } from "@/lib/site";

const CHECKLIST = [
  { label: `Add ${site.name} to your server`, done: true },
  { label: "Open the dashboard", done: true },
  { label: "Turn on AutoMod", done: false },
];

function GettingStarted() {
  const done = CHECKLIST.filter((item) => item.done).length;
  return (
    <div aria-hidden="true" className="rounded-2xl border border-edge-strong bg-ink/60 p-5">
      <div className="flex items-center justify-between text-sm">
        <p className="font-semibold text-fg">Getting started</p>
        <p className="text-xs text-dim">
          {done} of {CHECKLIST.length}
        </p>
      </div>
      <div className="mt-3 h-1 rounded-full bg-white/[0.07]">
        {/* Fills up as the card scrolls into view */}
        <div className="reveal-fill h-1 rounded-full bg-brand" style={{ width: `${(done / CHECKLIST.length) * 100}%` }} />
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {CHECKLIST.map((item) => (
          <li
            key={item.label}
            className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 ${
              item.done ? "border-edge bg-white/[0.02]" : "border-brand/40 bg-brand/[0.06]"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span
                className={`grid size-4 place-items-center rounded-full ${
                  item.done ? "bg-brand text-white" : "border border-white/25"
                }`}
              >
                {item.done ? <Check className="size-2.5" strokeWidth={3.5} /> : null}
              </span>
              <span className={item.done ? "text-muted" : "text-fg"}>{item.label}</span>
            </span>
            <span className={`text-xs ${item.done ? "text-dim" : "font-medium text-brand-2"}`}>
              {item.done ? (
                "Done"
              ) : (
                <>
                  Next <span className="inline-block motion-safe:animate-nudge">→</span>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReadyCta() {
  return (
    <section className={`mx-auto max-w-6xl px-4 sm:px-6 ${sectionGap}`}>
      {/* overflow-clip, not overflow-hidden: hidden would make this card the scroll container, and the
          progress bar's scroll animation (reveal-fill) would then never move */}
      <div className="relative overflow-clip rounded-3xl border border-edge bg-panel px-6 py-12 sm:px-12 sm:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -right-20 h-96 w-[36rem] rounded-full bg-[radial-gradient(closest-side,rgba(123,107,255,0.18),transparent)]"
        />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_minmax(0,400px)]">
          <div>
            <h2 className={headingClass}>
              Ready when
              <br />
              your server is.
            </h2>
            <p className={`mt-4 max-w-md ${leadClass}`}>
              Add {site.name} in under a minute, then set everything up from the dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={site.links.invite}>Add to Discord</ButtonLink>
              <ButtonLink href={site.links.dashboard} variant="ghost">
                Open Web Dashboard
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
            </div>
            <p className="mt-4 text-xs text-dim">Free forever plan · No credit card</p>
          </div>
          <GettingStarted />
        </div>
      </div>
    </section>
  );
}
