import { AuthErrorNotice } from "@/components/landing/AuthErrorNotice";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { Navbar } from "@/components/landing/Navbar";
import { Pricing } from "@/components/landing/Pricing";
import { ReadyCta } from "@/components/landing/ReadyCta";
import { Showcase } from "@/components/landing/Showcase";

// The landing page must stay fully static: cheap to serve and fast to load.
export const ensureStatic = "navigation";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main" className="overflow-x-clip">
        <Hero />
        <Showcase />
        <Pricing />
        <ReadyCta />
      </main>
      <Footer />
      <AuthErrorNotice />
    </>
  );
}
