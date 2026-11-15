"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { site } from "@/lib/site";

// Shows a notice when Discord login didn't finish (Better Auth sends people to /?auth=error).
// Reads the URL after load, so the landing page itself stays fully static.
export function AuthErrorNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") !== "error") return;
    // Show on the next frame (not cancelled on cleanup: React's dev double-run of effects
    // would otherwise cancel it after the URL is already cleaned), then clean the URL.
    requestAnimationFrame(() => setShow(true));
    window.history.replaceState(null, "", window.location.pathname + window.location.hash);
  }, []);

  if (!show) return null;

  return (
    <div role="alert" className="fixed inset-x-4 bottom-4 z-[60] mx-auto flex max-w-md items-start gap-3 rounded-xl border border-bad/40 bg-[#1a0f14]/95 p-4 text-sm shadow-2xl backdrop-blur sm:bottom-6">
      <div className="flex-1">
        <p className="font-semibold text-fg">Discord login didn&apos;t finish</p>
        <p className="mt-1 text-muted">
          Nothing was saved.{" "}
          <a href={site.links.login} className="font-medium text-brand-2 underline-offset-2 hover:underline">
            Try again
          </a>
        </p>
      </div>
      <button type="button" onClick={() => setShow(false)} aria-label="Dismiss" className="rounded-md p-1 text-dim transition hover:text-fg">
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
