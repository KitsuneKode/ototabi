import type { Metadata } from "next";

import { cn } from "@ototabi/ui/lib/utils";
import "@ototabi/ui/globals.css";
import { Courier_Prime, Oswald } from "next/font/google";

import { Providers } from "@/components/providers";

const oswald = Oswald({ subsets: ["latin"], variable: "--font-sans" });

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
    <html lang="en" suppressHydrationWarning className={cn("font-sans", oswald.variable)}>
      <body className={`${oswald.variable} ${fontMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
