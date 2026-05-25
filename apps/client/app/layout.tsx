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

export const metadata: Metadata = {
  title: "OtoTabi Studio — Professional Remote Recording",
  description:
    "Browser-based high-quality audio and video recording. Each participant records locally in pristine quality while staying synced in real-time.",
  icons: { icon: "/favicon.ico" },
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
