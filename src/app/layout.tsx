import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { THEME_SCRIPT } from "@/components/ThemeToggle";
import { SITE } from "@/lib/site";

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
  },
};

export const viewport: Viewport = { themeColor: "#0b0f14" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:p-2">
          Sari la conținut
        </a>
        <SiteHeader />
        <main
          id="main"
          className="mx-auto min-h-svh w-full max-w-3xl flex-1 px-4 py-6"
        >
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
