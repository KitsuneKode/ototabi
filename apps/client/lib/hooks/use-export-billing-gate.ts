"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { useAuthGate } from "@/lib/hooks/use-session";
import { useTRPC } from "@/trpc/client";

export function useExportBillingGate(sessionId: string) {
  const trpc = useTRPC();
  const { sessionReady } = useAuthGate();

  const { data: usageData } = useQuery({
    ...trpc.usage.get.queryOptions(),
    enabled: sessionReady,
  });

  const checkout = useMutation(
    trpc.billing.checkout.mutationOptions({
      onSuccess: (data) => {
        if (data.url) window.location.href = data.url;
      },
    }),
  );

  const startProCheckout = useCallback(() => {
    const successUrl = `${window.location.origin}/export/${sessionId}?billing=success`;
    checkout.mutate({ plan: "pro", successUrl });
  }, [checkout, sessionId]);

  return {
    canTextEdit: usageData?.features.textBasedEditing ?? false,
    usageData,
    checkoutIsPending: checkout.isPending,
    startProCheckout,
  };
}
