import type { Metadata, Viewport } from "next";
import { Barlow_Semi_Condensed } from "next/font/google";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { THEME_SCRIPT } from "@/components/ThemeToggle";
import { DEMO_BANNER, IS_DEMO } from "@/lib/mode";
import { OG_IMAGE, SITE } from "@/lib/site";

/** Display font for headings (OFL). Body text stays on the system font. */
const display = Barlow_Semi_Condensed({
  weight: ["600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.title, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: {
    type: "website",
    locale: "ro_RO",
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
  // Demo builds: never indexed.
  ...(IS_DEMO ? { robots: { index: false, follow: false } } : {}),
};

export const viewport: Viewport = { themeColor: "#0a0d12" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ro"
      className={`${display.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <div className="scene" aria-hidden />
        <a href="#main" className="sr-only focus:not-sr-only focus:p-2">
          Sari la conținut
        </a>
        {IS_DEMO && (
          <div
            role="note"
            className="bg-accent text-on-accent px-4 py-2 text-center text-sm font-bold"
          >
            {DEMO_BANNER}
          </div>
        )}
        <SiteHeader />
        <main
          id="main"
          className="mx-auto min-h-svh w-full max-w-5xl flex-1 px-4 py-6"
        >
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
