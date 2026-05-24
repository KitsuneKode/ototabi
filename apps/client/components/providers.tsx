"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

import { TRPCReactProvider } from "@/trpc/client";

/**
 * Wraps child components with theme and TRPC context providers.
 *
 * Provides both theme management and TRPC client context to all nested components.
 *
 * @param children - The React nodes to be rendered within the providers
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <TRPCReactProvider>{children}</TRPCReactProvider>
    </NextThemesProvider>
  );
}
