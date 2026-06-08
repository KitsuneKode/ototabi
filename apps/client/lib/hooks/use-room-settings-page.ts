"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useTRPC } from "@/trpc/client";

export function useRoomSettingsPage(roomId: string) {
  const router = useRouter();
  const trpc = useTRPC();

  const [roomNameDraft, setRoomNameDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    data: roomInfo,
    isLoading: roomInfoIsLoading,
    refetch: roomInfoRefetch,
  } = useQuery(trpc.rooms.getRoom.queryOptions({ code: roomId }, { enabled: !!roomId }));

  const { data: authSession, isLoading: authStateIsLoading } = useQuery(
    trpc.auth.getSession.queryOptions(),
  );

  const { data: sessions, isLoading: sessionsIsLoading } = useQuery(
    trpc.recordings.getRecordingSessions.queryOptions(
      { roomId: roomInfo?.id ?? "" },
      { enabled: !!roomInfo?.id },
    ),
  );

  const updateMutation = useMutation(
    trpc.rooms.updateRoom.mutationOptions({
      onSuccess: () => {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        void roomInfoRefetch();
      },
      onError: (err: { message?: string }) => setSaveError(err.message ?? "Failed to update room"),
    }),
  );

  const deleteMutation = useMutation(
    trpc.rooms.deleteRoom.mutationOptions({
      onSuccess: () => router.push("/dashboard"),
    }),
  );

  const roomName = roomNameDraft ?? roomInfo?.name ?? "";
  const confirmMatch = deleteConfirm === roomInfo?.code;

  const handleSave = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSaveError("");
      if (!roomInfo?.id) return;
      updateMutation.mutate(
        { id: roomInfo.id, name: roomName },
        { onSuccess: () => setRoomNameDraft(null) },
      );
    },
    [roomInfo?.id, roomName, updateMutation],
  );

  const handleCopyLink = useCallback(() => {
    if (!roomInfo?.code) return;
    navigator.clipboard.writeText(roomInfo.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [roomInfo?.code]);

  const handleDelete = useCallback(() => {
    if (!roomInfo?.id) return;
    deleteMutation.mutate({ id: roomInfo.id });
  }, [roomInfo?.id, deleteMutation]);

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

  return {
    roomInfo,
    roomInfoIsLoading,
    authStateIsLoading,
    isAuthenticated: Boolean(authSession),
    sessions,
    sessionsIsLoading,
    roomName,
    setRoomNameDraft,
    copied,
    saveError,
    saveSuccess,
    updateMutation,
    handleSave,
    handleCopyLink,
    roomInfoRefetch,
    showDeleteModal,
    setShowDeleteModal,
    deleteConfirm,
    setDeleteConfirm,
    deleteDialogRef,
    closeDeleteModal,
    confirmMatch,
    handleDelete,
    deleteMutation,
  };
}
