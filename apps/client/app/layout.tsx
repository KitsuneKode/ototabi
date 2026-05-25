import type { Metadata } from "next";

import { cn } from "@ototabi/ui/lib/utils";
import { Courier_Prime, Oswald, Source_Sans_3 } from "next/font/google";
import "@ototabi/ui/globals.css";
/** Display — chassis labels, headings, mechanical buttons (uppercase) */
const fontDisplay = Oswald({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

/** Body — paragraphs, descriptions, readable UI prose */
const fontSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
});

const fontMono = Courier_Prime({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const siteTitle = "Ototabi Studio — Professional Remote Recording";
const siteDescription =
  "Browser-based high-quality audio and video recording. Each participant records locally in pristine quality while staying synced in real-time.";
const brandTagline = "LOCAL MASTERS. SYNCED.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s · Ototabi Studio",
  },
  description: siteDescription,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Ototabi Studio",
    title: `Ototabi Studio — ${brandTagline}`,
    description: siteDescription,
    images: [
      {
        url: "/brand/og.png",
        width: 1200,
        height: 630,
        alt: `Ototabi Studio — ${brandTagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Ototabi Studio — ${brandTagline}`,
    description: siteDescription,
    images: ["/brand/twitter.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(fontDisplay.variable, fontSans.variable, fontMono.variable)}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
