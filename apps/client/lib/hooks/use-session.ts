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
};

export type SessionPayload = {
  user: SessionUser;
} | null;

function mapAuthClientSession(
  data: Awaited<ReturnType<typeof authClient.getSession>>["data"],
): SessionPayload {
  if (!data?.user) return null;
  return {
    user: {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      image: data.user.image ?? null,
    },
  };
}

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
    const { data } = await authClient.getSession();
    const mapped = mapAuthClientSession(data);
    const queryKey = trpc.auth.getSession.queryOptions().queryKey;

    queryClient.setQueryData(queryKey, mapped);

    return mapped;
  }, [queryClient, trpc]);
}
