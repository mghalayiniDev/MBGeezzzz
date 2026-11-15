import Link from "next/link";
import { SessionWatcher } from "@/components/dashboard/SessionWatcher";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { Footer } from "@/components/landing/Footer";
import { Logo } from "@/components/ui/Logo";
import { dashboardGap } from "@/components/ui/Section";
import { getCurrentUser } from "@/lib/session";
import { site } from "@/lib/site";

export const metadata = {
  title: `Dashboard · ${site.name}`,
  robots: { index: false, follow: false },
};

// Block on the server until the session is verified (no pre-rendered shell for this segment).
export const instant = false;

/**
 * Auth gate for everything under /dashboard.
 * The session is verified with Convex BEFORE any HTML is rendered. Without a valid session,
 * getCurrentUser() redirects to Discord login, so not a single byte of dashboard markup is sent.
 * (proxy.js is only the fast first filter; this is the real check.)
 */
export default async function DashboardLayout({ children }) {
  const me = await getCurrentUser();

  return (
    // Column layout: on short pages the footer still sits at the bottom of the screen.
    <div className="flex min-h-screen flex-col">
      <SessionWatcher />
      <header className="border-b border-edge bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* flex items-center: an inline link would sit the logo on the text baseline (a few px too high) */}
          <Link href="/" aria-label={`${site.name} home`} className="flex items-center rounded-lg">
            <Logo id="dashboard-logo" />
          </Link>
          <UserMenu user={me} />
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 sm:px-6">
        {children}
      </main>
      <Footer gapClass={dashboardGap} />
    </div>
  );
}
