import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { site } from "@/lib/site";

export const metadata = {
  title: `Page not found · ${site.name}`,
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main id="main" className="relative grid min-h-screen place-items-center overflow-hidden px-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,black,transparent)]"
      />
      <div className="relative text-center">
        <Logo id="not-found-logo" className="justify-center" />
        <p className="mt-10 font-mono text-sm text-brand-2">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-fg">Page not found</h1>
        <p className="mt-3 text-sm text-muted">This page doesn&apos;t exist, or you need to be signed in to see it.</p>
        <ButtonLink href="/" variant="ghost" className="mt-8">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back home
        </ButtonLink>
      </div>
    </main>
  );
}
