"use client";

import { Suspense } from "react";

import { ErrorBoundary } from "@/components/error-boundary";
import { Providers } from "@/components/providers";

/** App routes only — keeps /_global-error outside Providers (Next prerender). */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ErrorBoundary>
        <Providers>{children}</Providers>
      </ErrorBoundary>
    </Suspense>
  );
}
