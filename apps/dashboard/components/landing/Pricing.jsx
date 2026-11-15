"use client";

import { useState } from "react";
import { ArrowRight, Check, Minus } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { SectionLabel, anchorClass, headerGap, headingClass, leadClass, sectionGap } from "@/components/ui/Section";
import { pricing, site } from "@/lib/site";

// Must match the plan limits in AGENTS.md ("What's in Pro"). Convex enforces them.
// true = included, false = not included, string = shown as text.
const ROWS = [
  { feature: "Web dashboard", free: true, pro: true },
  { feature: "Embed builder & welcome messages", free: true, pro: true },
  { feature: "Moderation & logging", free: true, pro: true },
  { feature: "AutoMod", free: "Basics", pro: "Custom punishments" },
  { feature: "Button role menus", free: "3", pro: "Unlimited" },
  { feature: "Outgoing webhooks", free: false, pro: true },
  { feature: "Analytics history", free: "7 days", pro: "90 days" },
  { feature: "Support", free: "Community", pro: "Priority" },
];

// Pro column outline: side borders on every cell, rounded top and bottom cells.
const PRO_CELL = "border-x border-brand/40 bg-brand/[0.06]";

function formatPrice(amount) {
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
}

function Value({ value, pro = false }) {
  if (value === true) {
    return (
      <>
        <span
          aria-hidden="true"
          className={`grid size-5 place-items-center rounded-full ${pro ? "bg-brand text-white" : "bg-white/[0.07] text-muted"}`}
        >
          <Check className="size-3" strokeWidth={3} />
        </span>
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <Minus aria-hidden="true" className="size-4 text-dim/60" />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <span className={pro ? "font-medium text-fg" : "text-muted"}>{value}</span>;
}

function BillingToggle({ yearly, onChange }) {
  const option = (active) =>
    `rounded-lg px-3.5 py-1.5 font-medium transition ${active ? "bg-white/[0.08] text-fg" : "text-muted hover:text-fg"}`;
  return (
    <div role="group" aria-label="Billing period" className="inline-flex rounded-xl border border-edge bg-ink/60 p-1 text-xs">
      <button type="button" aria-pressed={!yearly} onClick={() => onChange(false)} className={option(!yearly)}>
        Monthly
      </button>
      <button type="button" aria-pressed={yearly} onClick={() => onChange(true)} className={`${option(yearly)} flex items-center gap-1.5`}>
        Yearly
        <span className="text-[10px] text-ok">−{Math.round(pricing.yearlyDiscount * 100)}%</span>
      </button>
    </div>
  );
}

export function Pricing() {
  const [yearly, setYearly] = useState(false);
  const discount = 1 - pricing.yearlyDiscount;
  const proPrice = yearly ? pricing.proMonthly * discount : pricing.proMonthly;
  const yearlyTotal = pricing.proMonthly * 12 * discount;

  return (
    <section aria-labelledby="pricing-heading" className={`mx-auto max-w-6xl px-4 sm:px-6 ${sectionGap}`}>
      <div id="pricing" className={anchorClass} />
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <SectionLabel>Pricing</SectionLabel>
          <h2 id="pricing-heading" className={`mt-3 ${headingClass}`}>
            Free while you grow.
          </h2>
          <p className={`mt-3 ${leadClass}`}>Start free on any server. Upgrade when you need more.</p>
        </div>
        <BillingToggle yearly={yearly} onChange={setYearly} />
      </div>

      <div className={`card ${headerGap} px-3 pt-7 pb-3 sm:px-8 sm:pb-5 2xl:pt-8 2xl:pb-6`}>
        <table className="w-full table-fixed border-separate border-spacing-0 text-[13px] sm:text-sm">
          <caption className="sr-only">Compare the Free and Pro plans</caption>
          <colgroup>
            <col className="w-[38%] sm:w-[44%]" />
            <col className="w-[31%] sm:w-[28%]" />
            <col className="w-[31%] sm:w-[28%]" />
          </colgroup>

          <thead>
            <tr>
              <th scope="col" className="pr-3 pb-6 text-left align-bottom font-normal">
                <span className="block text-sm font-semibold text-fg sm:text-base">Compare plans</span>
                <span className="mt-1 block text-xs text-dim">Prices are per server, in USD.</span>
              </th>
              <th scope="col" className="px-3 pt-5 pb-6 text-left align-top font-normal sm:px-5">
                <span className="block text-[11px] font-medium tracking-[0.12em] text-dim uppercase">Free</span>
                <span className="mt-3 flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-3xl font-semibold tracking-[-0.04em] text-fg sm:text-4xl">$0</span>
                  <span className="text-xs whitespace-nowrap text-muted">/ forever</span>
                </span>
                <span className="mt-1 block text-xs text-dim">No card required</span>
              </th>
              <th scope="col" className={`relative rounded-t-2xl border-t px-3 pt-5 pb-6 text-left align-top font-normal sm:px-5 ${PRO_CELL}`}>
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap text-white">
                  Recommended
                </span>
                <span className="block text-[11px] font-medium tracking-[0.12em] text-brand-2 uppercase">Pro</span>
                <span className="mt-3 flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-3xl font-semibold tracking-[-0.04em] text-fg sm:text-4xl">{formatPrice(proPrice)}</span>
                  <span className="text-xs whitespace-nowrap text-muted">/ month</span>
                </span>
                <span className="mt-1 block text-xs text-dim">
                  {yearly ? `Billed ${formatPrice(yearlyTotal)} yearly` : "Billed monthly"}
                </span>
              </th>
            </tr>
          </thead>

          <tbody>
            {ROWS.map((row) => (
              <tr key={row.feature}>
                <th scope="row" className="border-t border-edge py-3 2xl:py-3.5 pr-3 text-left font-normal text-muted">
                  {row.feature}
                </th>
                <td className="border-t border-edge px-3 py-3 2xl:py-3.5 sm:px-5">
                  <Value value={row.free} />
                </td>
                <td className={`border-t border-t-edge px-3 py-3 2xl:py-3.5 sm:px-5 ${PRO_CELL}`}>
                  <Value value={row.pro} pro />
                </td>
              </tr>
            ))}

            <tr>
              <td className="border-t border-edge" />
              <td className="border-t border-edge px-1.5 pt-5 pb-5 sm:px-5">
                <ButtonLink href={site.links.invite} variant="ghost" className="w-full">
                  <span className="sm:hidden">Add</span>
                  <span className="hidden sm:inline">Add to Discord</span>
                </ButtonLink>
              </td>
              <td className={`rounded-b-2xl border-t border-b border-t-edge px-1.5 pt-5 pb-5 sm:px-5 ${PRO_CELL}`}>
                <ButtonLink href={site.links.dashboard} className="w-full">
                  Get Pro
                  <ArrowRight className="size-4" aria-hidden="true" />
                </ButtonLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
