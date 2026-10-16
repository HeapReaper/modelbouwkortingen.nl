import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/core/Navbar";
import Footer from "./core/Footer";

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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="h-full antialiased flex flex-col min-h-screen bg-gray-50">
        {/* Navbar */}
        <Navbar />

        <main className="flex-grow container mx-auto p-4">{children}</main>

        {/* Footer */}
        <Footer />
      </body>
    </html>
  );
}
