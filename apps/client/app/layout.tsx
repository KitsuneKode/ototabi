import type { Metadata } from "next";

import { Oswald, Courier_Prime } from "next/font/google";
import "@ototabi/ui/globals.css";

import { Providers } from "@/components/providers";

const fontSans = Oswald({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
