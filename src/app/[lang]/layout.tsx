import type { Metadata, Viewport } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Suspense } from "react";
import { TopBarPhones } from "@/components/core/ContactBar";
import Footer from "@/components/core/Footer";
import Navbar from "@/components/core/Navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/i18n/client";
import { LOCALES, OG_LOCALES } from "@/i18n/config";
import { alternates, feedLink } from "@/i18n/metadata";
import { getI18n } from "@/i18n/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://modelbouwkortingen.nl";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { lang, dict } = await getI18n();
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: dict.meta.defaultTitle,
      template: "%s | Modelbouwkortingen.nl",
    },
    description: dict.meta.description,
    alternates: {
      ...alternates(lang, "/"),
      types: feedLink(lang, dict.feed.title),
    },
    openGraph: {
      type: "website",
      locale: OG_LOCALES[lang],
      siteName: "Modelbouwkortingen.nl",
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#14161f" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const { lang, dict } = await getI18n();
  return (
    <html
      lang={lang}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-background text-foreground">
        <I18nProvider lang={lang} dict={dict}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <a
              href="#inhoud"
              className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
            >
              {dict.layout.skipToContent}
            </a>
            <div className="bg-primary text-primary-foreground">
              <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-x-6 gap-y-1 px-4 py-1.5 text-sm font-semibold sm:flex-row">
                <p className="text-center">
                  {dict.layout.bannerBefore}{" "}
                  <span className="text-deal">
                    {dict.layout.bannerHighlight}
                  </span>{" "}
                  {dict.layout.bannerAfter}
                </p>
                <Suspense fallback={null}>
                  <TopBarPhones />
                </Suspense>
              </div>
            </div>
            <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
              <Navbar />
            </header>

            <main id="inhoud" className="flex-1">
              {children}
            </main>

            <Footer />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
