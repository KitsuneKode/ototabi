"use client";

import { useChat } from "@livekit/components-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { AnalogInset } from "@/components/ui/analog-card";
import { MonoLabel, MechButton } from "@/components/ui/retro-primitives";
import { formatTime } from "@/lib/date-utils";
import { useTRPC } from "@/trpc/client";

type StudioChatPanelProps = {
  roomDbId: string;
  sessionUserName: string;
};

export function StudioChatPanel({ roomDbId, sessionUserName }: StudioChatPanelProps) {
  const trpc = useTRPC();
  const [chatInput, setChatInput] = useState("");

  const { chatMessages, send } = useChat();
  const persistMessage = useMutation(trpc.chat.sendMessage.mutationOptions());

  const {
    data: persistedMessagesQueryData,
    isLoading: _persistedMessagesQueryIsLoading,
    error: _persistedMessagesQueryError,
    refetch: _persistedMessagesQueryRefetch,
    isFetching: _persistedMessagesQueryIsFetching,
    isPending: _persistedMessagesQueryIsPending,
    isSuccess: _persistedMessagesQueryIsSuccess,
    isError: _persistedMessagesQueryIsError,
    status: _persistedMessagesQueryStatus,
  } = useQuery(trpc.chat.getMessages.queryOptions({ roomId: roomDbId }, { enabled: !!roomDbId }));

  const allMessages = useMemo(() => {
    const persisted = (persistedMessagesQueryData ?? []).map((m) => ({
      id: m.id,
      timestamp: new Date(m.createdAt).getTime(),
      message: m.message,
      from: { identity: m.user.name, name: m.user.name },
    }));

    const dedupedPersisted = persisted.filter(
      (p) =>
        !chatMessages.some(
          (r) =>
            r.from?.identity === p.from?.identity &&
            r.message === p.message &&
            Math.abs(r.timestamp - p.timestamp) < 3000,
        ),
    );

    return [...dedupedPersisted, ...chatMessages].toSorted((a, b) => a.timestamp - b.timestamp);
  }, [persistedMessagesQueryData, chatMessages]);

  const handleSend = async () => {
    if (!chatInput.trim()) return;
    try {
      await send(chatInput.trim());
      await persistMessage.mutateAsync({
        roomId: roomDbId,
        message: chatInput.trim(),
      });
      setChatInput("");
    } catch (e) {
      console.error("Failed to send message:", e);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {allMessages.length === 0 ? (
          <AnalogInset className="flex flex-col items-center justify-center gap-3 border-dashed p-6 text-center">
            <div className="space-y-1">
              <MonoLabel className="block">No Messages</MonoLabel>
              <p className="text-muted-foreground/60 max-w-[160px] font-mono text-[10px] leading-normal uppercase">
                Chat messages will appear here.
              </p>
            </div>
          </AnalogInset>
        ) : (
          allMessages.map((msg) => {
            const isLocal = msg.from?.identity === sessionUserName;
            return (
              <div key={msg.id} className={`flex ${isLocal ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[90%] rounded px-3 py-2 ${
                    isLocal
                      ? "bg-accent/20 border-accent/30 border"
                      : "bg-popover border-border border"
                  }`}
                >
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="text-muted-foreground font-mono text-[10px] font-bold uppercase">
                      {msg.from?.name || msg.from?.identity || "Unknown"}
                    </span>
                    <span className="text-muted-foreground/50 font-mono text-[10px]">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-foreground font-mono text-[11px] leading-relaxed break-words">
                    {msg.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="border-border border-t p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Type a message..."
            className="bg-popover border-border text-foreground placeholder:text-muted-foreground/40 focus:border-accent/60 flex-1 rounded border px-3 py-2 font-mono text-[11px] focus:outline-none"
          />
          <MechButton onClick={() => void handleSend()} className="h-auto px-3 py-2">
            Send
          </MechButton>
        </div>
      </div>
    </div>
  );
}
