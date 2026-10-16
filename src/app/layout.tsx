import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "./globals.css";
import { Navbar } from "./components/core/Navbar";
import Footer from "./core/Footer";
import { cn } from "@/lib/utils";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Modelbouwkortingen.nl",
  description: "Vindt aanbiedingen bij jouw favoriete webshop",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn(geistSans.variable, geistMono.variable, "font-sans", figtree.variable)}>
      <body className="h-full antialiased flex flex-col min-h-screen bg-white">
        {/* Navbar */}
        <Navbar />

        <main className="flex-grow container mx-auto p-4">{children}</main>

        {/* Footer */}
        <Footer />
      </body>
    </html>
  );
}
