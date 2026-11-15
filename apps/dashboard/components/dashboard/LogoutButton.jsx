"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { signOutAndReload } from "@/lib/sign-out";

export function LogoutButton() {
  const [state, setState] = useState("idle"); // idle | pending | failed

  async function signOut() {
    setState("pending");
    try {
      await signOutAndReload();
    } catch {
      setState("failed");
    }
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={state === "pending"}
      className="inline-flex h-9 items-center gap-2 rounded-xl border border-edge-strong bg-white/[0.03] px-3 text-sm font-medium text-fg transition hover:bg-white/[0.07] disabled:opacity-60"
    >
      <LogOut className="size-4" aria-hidden="true" />
      {state === "pending" ? "Logging out…" : state === "failed" ? "Try again" : "Log out"}
    </button>
  );
}
