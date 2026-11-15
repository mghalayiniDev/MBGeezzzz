"use client";

import { RotateCcw } from "lucide-react";

// Shown if loading the dashboard fails (e.g. Convex unreachable). Never shows error details.
export default function DashboardError({ reset }) {
  return (
    <div className="card mx-auto mt-10 max-w-md p-8 text-center">
      <h1 className="text-xl font-semibold text-fg">Something went wrong</h1>
      <p className="mt-2 text-sm leading-6 text-muted">We couldn&apos;t load your dashboard. Please try again.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl border border-edge-strong bg-white/[0.03] px-4 text-sm font-semibold text-fg transition hover:bg-white/[0.07]"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        Try again
      </button>
    </div>
  );
}
