import type { Metadata } from "next";
import localFont from "next/font/local";
import { Open_Sans } from "next/font/google";
import { Providers } from "./providers";
import { SiteSettingsProvider } from "@/components/providers/site-settings-provider";
import { fetchSettings } from "@/lib/services/settings.server";
import { hexToHslChannels } from "@/lib/utils/color";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const suse = Open_Sans({
  subsets: ["latin"],
  variable: "--font-suse",
  weight: ["400", "600", "700", "800"],
  display: "swap",
});
const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSettings();
  const siteName = settings.site_name || "Headless LMS";
  return {
    metadataBase: process.env.NEXT_PUBLIC_SITE_URL
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
      : undefined,
    title: { default: siteName, template: `%s | ${siteName}` },
    description:
      settings.description ||
      "A modern headless learning platform powered by WordPress and Next.js.",
    openGraph: {
      type: "website",
      siteName,
      images: settings.og_image_url ? [settings.og_image_url] : undefined,
    },
    twitter: { card: "summary_large_image" },
    icons: settings.favicon_url ? [{ rel: "icon", url: settings.favicon_url }] : undefined,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await fetchSettings();

  // shadcn reads hsl(var(--primary)) so we need HSL channels, not a hex string.
  const cssVars: Record<string, string> = {};
  if (settings.primary_color) {
    const hsl = hexToHslChannels(settings.primary_color);
    if (hsl) cssVars["--primary"] = hsl;
  }
  if (settings.accent_color) {
    const hsl = hexToHslChannels(settings.accent_color);
    if (hsl) cssVars["--accent"] = hsl;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${suse.variable} ${openSans.variable} font-sans antialiased`}
        style={cssVars as React.CSSProperties}
        suppressHydrationWarning
      >
        <Providers>
          <SiteSettingsProvider settings={settings}>{children}</SiteSettingsProvider>
        </Providers>
      </body>
    </html>
  );
}
