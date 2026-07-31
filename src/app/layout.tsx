import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevStash",
  description: "A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/*
         * Mounted at the root so a toast outlives the navigation that fired it,
         * and *before* `children` deliberately: sonner's store publishes only to
         * current subscribers and the Toaster starts from an empty list, so a
         * toast raised in a page's mount effect is dropped unless the Toaster
         * subscribed first. Sibling effects run in render order, so this order
         * is what makes a toast-on-arrival work. It renders `position: fixed`,
         * so being first in the DOM costs nothing visually.
         */}
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}
