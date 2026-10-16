import type { Metadata, Viewport } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Footer from "@/components/core/Footer";
import Navbar from "@/components/core/Navbar";
import { ThemeProvider } from "@/components/theme-provider";

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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Modelbouwkortingen.nl — De beste RC-aanbiedingen op één plek",
    template: "%s | Modelbouwkortingen.nl",
  },
  description:
    "Vind RC-auto's, vliegtuigen, helicopters, drones en onderdelen met korting bij TopRC, Toemen, Wetronic en meer. Dagelijks bijgewerkt.",
  openGraph: {
    type: "website",
    locale: "nl_NL",
    siteName: "Modelbouwkortingen.nl",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#14161f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-background text-foreground">
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
            Naar de inhoud
          </a>
          <div className="bg-primary text-primary-foreground">
            <p className="mx-auto max-w-7xl px-4 py-1.5 text-center text-sm font-semibold">
              Alleen échte kortingen: minimaal{" "}
              <span className="text-deal">€5 of 5%</span> goedkoper — dagelijks
              bijgewerkt
            </p>
          </div>
          <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
            <Navbar />
          </header>

          <main id="inhoud" className="flex-1">
            {children}
          </main>

          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
