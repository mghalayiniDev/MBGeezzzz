import { Activity, ArrowUpRight, BookOpen, Check, LifeBuoy } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { dashboardGap } from "@/components/ui/Section";
import { botInviteUrl, site } from "@/lib/site";

const HELP = [
  { label: "Documentation", text: "Guides for every module", href: site.links.docs, Icon: BookOpen, soon: true },
  { label: "Support server", text: "Ask the team and other admins", href: site.links.support, Icon: LifeBuoy },
  { label: "Bot status", text: "Uptime and incidents", href: site.links.status, Icon: Activity, separatePage: true },
];

function StepIcon({ state }) {
  if (state === "done") {
    return (
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand text-white">
        <Check className="size-3" strokeWidth={3.5} aria-hidden="true" />
      </span>
    );
  }
  return <span className={`size-5 shrink-0 rounded-full border ${state === "next" ? "border-brand-2" : "border-white/20"}`} />;
}

/**
 * Real progress, from the user's own data (never made-up numbers):
 * signed in (always, on this page) -> the bot is in one of their servers -> a module is set up
 * (modules arrive in Phase 1, so that step says "Coming soon" for now).
 */
export function GettingStarted({ guilds }) {
  const botAdded = guilds.some((guild) => guild.botInstalled);
  const invite = botInviteUrl();
  const steps = [
    { label: "Sign in with Discord", state: "done" },
    { label: `Add ${site.name} to a server`, state: botAdded ? "done" : "next", invite: botAdded ? null : invite },
    { label: "Set up your first module", hint: "Welcome messages, button roles, AutoMod", state: "soon" },
  ];
  const done = steps.filter((step) => step.state === "done").length;

  return (
    <section aria-labelledby="start-heading" className={dashboardGap}>
      <h2 id="start-heading" className="text-lg font-semibold text-fg">
        Getting started
      </h2>
      <p className="mt-1 text-sm text-muted">Three steps to a fully set-up server.</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between text-sm">
            <p className="font-medium text-fg">Your progress</p>
            <p className="text-xs text-dim">
              {done} of {steps.length} done
            </p>
          </div>
          <div
            className="mt-3 h-1 rounded-full bg-white/[0.07]"
            role="progressbar"
            aria-label="Setup progress"
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-valuenow={done}
          >
            <div className="h-1 rounded-full bg-brand" style={{ width: `${(done / steps.length) * 100}%` }} />
          </div>

          <ol className="mt-5 space-y-2.5">
            {steps.map((step) => (
              <li
                key={step.label}
                className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 ${
                  step.state === "next" ? "border-brand/40 bg-brand/[0.06]" : "border-edge bg-white/[0.02]"
                }`}
              >
                <StepIcon state={step.state} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${step.state === "done" ? "text-muted" : "text-fg"}`}>{step.label}</p>
                  {step.hint ? <p className="mt-0.5 text-xs text-dim">{step.hint}</p> : null}
                </div>
                {step.state === "done" ? <span className="text-xs text-dim">Done</span> : null}
                {step.state === "soon" ? (
                  <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] text-dim">Coming soon</span>
                ) : null}
                {step.invite ? (
                  <a href={step.invite} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "sm")}>
                    Add bot
                  </a>
                ) : null}
              </li>
            ))}
          </ol>
        </div>

        <div className="card p-5 sm:p-6">
          <p className="text-sm font-medium text-fg">Need help?</p>
          <ul className="mt-4 space-y-1">
            {HELP.map(({ label, text, href, Icon, soon, separatePage }) => (
              <li key={label}>
                <a
                  href={href}
                  className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/[0.04]"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand-2">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-fg">
                      {label}
                      {separatePage ? <ArrowUpRight className="size-3.5 text-dim" aria-hidden="true" /> : null}
                    </span>
                    <span className="block text-xs text-dim">{text}</span>
                  </span>
                  {soon ? <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] text-dim">Soon</span> : null}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
