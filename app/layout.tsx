import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";

import "@/app/globals.css";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const headingFont = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "LandlordForge",
  title: "LandlordForge — Landlord Portal",
  description: "Professional landlord operating system. Property management, tenant oversight, maintenance, rent collection, reports, and messaging — all in one polished demo.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "LandlordForge",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#09141d" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${headingFont.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
