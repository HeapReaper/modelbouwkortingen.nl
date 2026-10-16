import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/core/Footer";
import Navbar from "@/components/core/Navbar";

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
  description: "Vindt RC producten met korting bij jouw favoriete webshop!",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <header className="flex justify-center items-center gap-6 p-4">
        <Navbar></Navbar>
      </header>

      <body className="min-h-full flex flex-col">{children}</body>

      <Footer />
    </html>
  );
}
