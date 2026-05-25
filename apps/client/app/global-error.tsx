"use client";

/**
 * Root error boundary — must not use Providers, next-themes, or tRPC context.
 * Next prerenders this route separately from the root layout tree.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] font-sans text-[#e8e4dc] antialiased">
        <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
          <h1 className="font-mono text-sm tracking-widest uppercase">Console fault</h1>
          <p className="text-sm text-[#9a958c]">
            {error.message || "An unexpected error occurred."}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="border border-[#3d3a34] bg-[#1a1917] px-4 py-2 font-mono text-xs tracking-widest uppercase transition-colors hover:bg-[#252320]"
          >
            Retry
          </button>
        </main>
      </body>
    </html>
  );
}
