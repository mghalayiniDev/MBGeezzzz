"use client";

import { useEffect } from "react";

const CHECK_EVERY_MS = 30_000;

/**
 * Kicks an open dashboard tab out the moment its session cookie is gone
 * (deleted in DevTools, logged out in another tab, expired).
 * Checks when the tab regains focus, becomes visible, and every 30s while visible.
 * The ping is answered by proxy.js from the cookie alone: no Convex call, no cost.
 */
export function SessionWatcher() {
  useEffect(() => {
    let leaving = false;

    async function check() {
      if (leaving || document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/session", { cache: "no-store", credentials: "same-origin" });
        if (res.status === 401) {
          leaving = true;
          // replace(): the dashboard isn't kept in history, and dashboard pages are no-store,
          // so Back can't bring it back. A full load also clears everything held in memory.
          window.location.replace("/");
        }
      } catch {
        // Offline or network hiccup: keep the page; the next check (or click) decides.
      }
    }

    const onVisibility = () => document.visibilityState === "visible" && check();
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", onVisibility);
    const timer = setInterval(check, CHECK_EVERY_MS);

    return () => {
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(timer);
    };
  }, []);

  return null;
}
