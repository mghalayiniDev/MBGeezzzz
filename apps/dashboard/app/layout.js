import { Geist, Geist_Mono } from "next/font/google";
import { SIGNED_IN_HINT_COOKIE } from "@/lib/signed-in-hint";
import { site } from "@/lib/site";
import "./globals.css";

// Runs before the first paint: if the "signed in" hint cookie exists, mark <html> so the
// navbar shows the signed-in layout right away (no flash of "Log in"). Pages stay static.
const signedInScript = `(function(){try{if(/(?:^|; )${SIGNED_IN_HINT_COOKIE}=1(?:;|$)/.test(document.cookie))document.documentElement.setAttribute("data-signed-in","")}catch(e){}})()`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: `${site.name} · ${site.tagline}`,
  description: site.description,
  openGraph: {
    title: `${site.name} · ${site.tagline}`,
    description: site.description,
    type: "website",
  },
};

export const viewport = {
  themeColor: "#0b0c0e", // same as --color-ink in globals.css
  colorScheme: "dark",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: signedInScript }} />
      </head>
      <body className="min-h-full bg-ink font-sans text-fg">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
