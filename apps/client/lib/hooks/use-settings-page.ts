"use client";

import { authClient } from "@ototabi/auth/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useTRPC } from "@/trpc/client";

export function useSettingsPage() {
  const router = useRouter();
  const trpc = useTRPC();

  const [displayNameOverride, setDisplayNameOverride] = useState<string | null>(null);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  const {
    data: user,
    isLoading: meIsLoading,
    refetch: refetchMe,
  } = useQuery(trpc.user.getMe.queryOptions());

  const displayName = displayNameOverride ?? user?.name ?? "";
  const setDisplayName = useCallback((name: string) => setDisplayNameOverride(name), []);

  const updateProfile = useMutation(
    trpc.user.updateProfile.mutationOptions({
      onSuccess: () => {
        setProfileSuccess(true);
        setDisplayNameOverride(null);
        setTimeout(() => setProfileSuccess(false), 2500);
        void refetchMe();
      },
      onError: (err: { message?: string }) =>
        setProfileError(err.message ?? "Failed to update profile"),
    }),
  );

  const deleteAccount = useMutation(
    trpc.user.deleteAccount.mutationOptions({
      onSuccess: async () => {
        await authClient.signOut();
        router.push("/");
      },
    }),
  );

  const { data: subscriptionData, isLoading: subscriptionIsLoading } = useQuery(
    trpc.billing.getSubscription.queryOptions(),
  );

  const checkout = useMutation(
    trpc.billing.checkout.mutationOptions({
      onSuccess: (data) => {
        if (data.url) window.location.href = data.url;
      },
    }),
  );

  const startCheckout = useCallback(
    (plan: "creator" | "pro" | "studio") => {
      const successUrl = `${window.location.origin}/settings?billing=success`;
      checkout.mutate({ plan, successUrl });
    },
    [checkout],
  );

  const handleSaveProfile = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setProfileError("");
      updateProfile.mutate({ name: displayName });
    },
    [displayName, updateProfile],
  );

  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    router.push("/");
  }, [router]);

  const handleDeleteAccount = useCallback(() => {
    deleteAccount.mutate();
  }, [deleteAccount]);

  useEffect(() => {
    const el = deleteDialogRef.current;
    if (!el) return;
    if (showDeleteModal) {
      el.showModal();
    } else {
      el.close();
    }
  }, [showDeleteModal]);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setDeleteConfirm("");
  }, []);

  const confirmMatch = deleteConfirm.toLowerCase() === "delete my account";

  return {
    user,
    meIsLoading,
    displayName,
    setDisplayName,
    profileError,
    profileSuccess,
    updateProfile,
    handleSaveProfile,
    subscriptionData,
    subscriptionIsLoading,
    startCheckout,
    checkoutIsPending: checkout.isPending,
    handleSignOut,
    showDeleteModal,
    setShowDeleteModal,
    deleteConfirm,
    setDeleteConfirm,
    deleteDialogRef,
    closeDeleteModal,
    confirmMatch,
    handleDeleteAccount,
    deleteAccount,
  };
}
