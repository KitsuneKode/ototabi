"use client";

import { authClient } from "@ototabi/auth/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useTRPC } from "@/trpc/client";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role?: string;
};

export type SessionPayload = {
  user: SessionUser;
} | null;

/**
 * Shared session query — keeps the last known user while refetching so navigation
 * does not flash the "gated" screen when cookies are still valid.
 */
export function useSessionQuery() {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.auth.getSession.queryOptions(),
    placeholderData: (previous) => previous,
    staleTime: 60 * 1000,
    retry: (failureCount, error) => {
      if (failureCount >= 1) return false;
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "";
      return !message.toLowerCase().includes("unauthorized");
    },
    refetchOnWindowFocus: true,
  });
}

export function useAuthGate() {
  const authState = useSessionQuery();
  const user = authState.data?.user;

  const isBooting = authState.isPending || (authState.isFetching && !user);
  const showGate = authState.isFetched && !authState.isFetching && !user;

  return {
    authState,
    user,
    isBooting,
    showGate,
    sessionReady: !!user,
  };
}

/**
 * Hydrates the tRPC session cache from Better Auth after sign-in/sign-up so the
 * dashboard does not flash gated / unauthorized before the refetch completes.
 */
export function useRefreshAuthSession() {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useCallback(async (): Promise<SessionPayload> => {
    await authClient.getSession();
    const queryKey = trpc.auth.getSession.queryOptions().queryKey;
    await queryClient.invalidateQueries({ queryKey });
    const mapped = queryClient.getQueryData<SessionPayload>(queryKey) ?? null;
    return mapped;
  }, [queryClient, trpc]);
}
