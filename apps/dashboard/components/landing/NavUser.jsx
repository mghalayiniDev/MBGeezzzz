"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, LayoutGrid, LogOut } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { signOutAndReload } from "@/lib/sign-out";
import { SIGNED_IN_HINT_COOKIE } from "@/lib/signed-in-hint";
import { site } from "@/lib/site";

function Avatar({ user, className = "size-7" }) {
  return user.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.image} alt="" width={36} height={36} referrerPolicy="no-referrer" className={`${className} shrink-0 rounded-full`} />
  ) : (
    <span className={`${className} shrink-0 rounded-full bg-brand/60`} aria-hidden="true" />
  );
}

/**
 * Avatar (and name from lg) that opens a small account menu: who's signed in, Your servers,
 * Log out. A simple disclosure: closes on outside click or Esc (focus goes back to the button).
 */
function AccountMenu({ user }) {
  const [open, setOpen] = useState(false);
  const [logout, setLogout] = useState("idle"); // idle | pending | failed
  const ref = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function onLogout() {
    setLogout("pending");
    try {
      await signOutAndReload();
    } catch {
      setLogout("failed");
    }
  }

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="account-menu"
        aria-label={`Account menu, signed in as ${user.name}`}
        onClick={() => setOpen((v) => !v)}
        className="flex min-w-0 items-center gap-3 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-white/[0.05] aria-expanded:bg-white/[0.05]"
      >
        <Avatar user={user} />
        {/* Name only from lg up; on smaller screens the avatar alone keeps the navbar balanced */}
        <span className="hidden max-w-[16rem] truncate text-sm font-medium text-fg lg:inline">{user.name}</span>
        <ChevronDown className={`size-3.5 shrink-0 text-dim transition ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open ? (
        <div
          id="account-menu"
          className="absolute top-full right-0 mt-2 w-64 rounded-2xl border border-edge-strong bg-raise p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)]"
        >
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Avatar user={user} className="size-9" />
            <div className="min-w-0">
              <p className="text-xs text-dim">Signed in as</p>
              <p className="truncate text-sm font-medium text-fg" title={user.name}>
                {user.name}
              </p>
            </div>
          </div>
          <div className="my-1 h-px bg-edge" />
          <a
            href={site.links.dashboard}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-white/[0.05] hover:text-fg"
          >
            <LayoutGrid className="size-4" aria-hidden="true" />
            Your servers
          </a>
          <button
            type="button"
            onClick={onLogout}
            disabled={logout === "pending"}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-bad/10 hover:text-bad disabled:opacity-60"
          >
            <LogOut className="size-4" aria-hidden="true" />
            {logout === "pending" ? "Logging out…" : logout === "failed" ? "Couldn't log out. Try again" : "Log out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Signed-in part of the landing navbar: account menu (avatar, name, log out) and a
 * "Your servers" button. Only visible when <html data-signed-in> is set (before paint, from the
 * hint cookie), and only then fetches the user, so logged-out visitors make no extra requests.
 */
export function NavUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!document.documentElement.hasAttribute("data-signed-in")) return undefined;
    let cancelled = false;

    fetch("/api/me", { cache: "no-store", credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then(({ user: me }) => {
        if (cancelled) return;
        if (me) {
          setUser(me);
        } else {
          // Session expired: drop the stale hint and fall back to the logged-out navbar.
          document.cookie = `${SIGNED_IN_HINT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
          document.documentElement.removeAttribute("data-signed-in");
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    // gap-7 (28px): same space as between "Log in" and "Add to Discord" in the logged-out navbar
    <div className="hidden min-w-0 items-center gap-7 signed-in:flex">
      {user ? (
        <AccountMenu user={user} />
      ) : (
        <span className="flex items-center gap-3" aria-hidden="true">
          <span className="size-7 animate-pulse rounded-full bg-white/[0.08]" />
          <span className="hidden h-3.5 w-20 animate-pulse rounded bg-white/[0.08] lg:inline-block" />
        </span>
      )}
      {/* On phones this button lives in the menus instead (keeps the bar uncluttered) */}
      <div className="hidden md:block">
        <ButtonLink href={site.links.dashboard} size="sm">
          Your servers
          <ArrowRight className="size-4" aria-hidden="true" />
        </ButtonLink>
      </div>
    </div>
  );
}
