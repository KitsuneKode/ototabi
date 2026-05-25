"use client";

import { Input } from "@ototabi/ui/components/input";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { MonoLabel, PanelTitle, StatusBadge } from "@/components/ui/retro-primitives";
import { formatDate } from "@/lib/date-utils";
import { Copy, FolderOpen, Search, Video } from "@/lib/icons";

export type DashboardRoom = {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt?: Date;
  isShared?: boolean;
};

type RoomTab = "all" | "owned" | "shared";

export function DashboardRoomList({
  ownedRooms,
  sharedRooms,
  selectedRoomId,
  onSelectRoom,
  searchQuery,
  onSearchChange,
  onCopyInvite,
  onOpenStudio,
  isLoading,
  copiedRoomCode,
}: {
  ownedRooms: DashboardRoom[];
  sharedRooms: DashboardRoom[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCopyInvite: (room: DashboardRoom) => void;
  onOpenStudio: (room: DashboardRoom) => void;
  isLoading: boolean;
  copiedRoomCode: string | null;
}) {
  const [tab, setTab] = useState<RoomTab>("all");

  const allRooms = useMemo(
    () => [
      ...ownedRooms.map((r) => ({ ...r, isShared: false as const })),
      ...sharedRooms.map((r) => ({ ...r, isShared: true as const })),
    ],
    [ownedRooms, sharedRooms],
  );

  const tabRooms = useMemo(() => {
    if (tab === "owned") return allRooms.filter((r) => !r.isShared);
    if (tab === "shared") return allRooms.filter((r) => r.isShared);
    return allRooms;
  }, [allRooms, tab]);

  const filteredRooms = tabRooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const setTabAll = useCallback(() => setTab("all"), []);
  const setTabOwned = useCallback(() => setTab("owned"), []);
  const setTabShared = useCallback(() => setTab("shared"), []);

  return (
    <AnalogCard className="flex min-h-[350px] flex-1 flex-col p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <PanelTitle label="Telemetry Links" title="Active Rooms" />
        <MonoLabel className="bg-popover border-border rounded border px-2 py-0.5">
          COUNT: {allRooms.length}
        </MonoLabel>
      </div>

      <div className="mb-3 flex gap-2">
        {(
          [
            ["all", "All", allRooms.length],
            ["owned", "Owned", ownedRooms.length],
            ["shared", "Shared", sharedRooms.length],
          ] as const
        ).map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            onClick={value === "all" ? setTabAll : value === "owned" ? setTabOwned : setTabShared}
            className={`rounded border px-2.5 py-1 font-mono text-[9px] font-bold tracking-widest uppercase transition-colors ${
              tab === value
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="text-muted-foreground/60 absolute top-2.5 left-3 h-3.5 w-3.5" />
        <Input
          type="text"
          placeholder="Filter by name or code..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border-border bg-popover text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-accent/60 h-9 rounded border pl-9 font-mono text-xs shadow-inner focus-visible:ring-1"
        />
      </div>

      {isLoading ? (
        <div className="text-muted-foreground flex flex-1 animate-pulse items-center justify-center font-mono text-xs tracking-widest uppercase">
          FETCHING ROOM TELEMETRY...
        </div>
      ) : allRooms.length === 0 ? (
        <AnalogInset className="flex flex-1 flex-col items-center justify-center border-dashed p-8 text-center">
          <FolderOpen className="text-muted-foreground/30 mb-3 h-8 w-8" />
          <MonoLabel className="mb-1 block">No active channels</MonoLabel>
          <p className="text-muted-foreground/60 max-w-[240px] font-mono text-[10px] leading-normal">
            Create your first room above, or accept a shared studio invite from another host.
          </p>
        </AnalogInset>
      ) : filteredRooms.length === 0 ? (
        <AnalogInset className="flex flex-1 flex-col items-center justify-center border-dashed p-8 text-center">
          <Search className="text-muted-foreground/30 mb-3 h-8 w-8" />
          <MonoLabel className="mb-1 block">No matches found</MonoLabel>
          <p className="text-muted-foreground/60 font-mono text-[10px]">
            No rooms matched &ldquo;{searchQuery}&rdquo;
          </p>
        </AnalogInset>
      ) : (
        <div className="max-h-[400px] flex-1 space-y-3 overflow-y-auto pr-1 md:max-h-[500px]">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              className={`hover:border-accent/40 cursor-pointer rounded border p-4 transition-[border-color] select-none ${
                selectedRoomId === room.id
                  ? "border-accent bg-accent/5 shadow-sm"
                  : "border-border bg-card shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="text-foreground text-sm font-bold uppercase">{room.name}</span>
                  {room.isShared ? (
                    <StatusBadge variant="warn" className="shrink-0 text-[10px]">
                      SHARED
                    </StatusBadge>
                  ) : null}
                </div>
                <MonoLabel className="bg-popover border-border text-foreground shrink-0 rounded border px-2 py-0.5">
                  {room.code}
                </MonoLabel>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <MonoLabel className="text-[9px]">EST: {formatDate(room.createdAt)}</MonoLabel>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyInvite(room);
                    }}
                    className="btn-mechanical text-secondary-foreground flex items-center gap-1 rounded px-2 py-1 text-[9px] font-bold tracking-wider uppercase transition-transform active:scale-95"
                  >
                    <Copy className="h-3 w-3" />
                    {copiedRoomCode === room.code ? "COPIED" : "INVITE"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenStudio(room);
                    }}
                    className="btn-mechanical text-accent border-accent/40 flex items-center gap-1 rounded border px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase transition-transform active:scale-95"
                  >
                    <Video className="h-3 w-3" />
                    STUDIO
                  </button>
                  <Link
                    href={`/rooms/${room.code}/settings`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground hover:text-foreground font-mono text-[9px] tracking-widest uppercase underline-offset-2 hover:underline"
                  >
                    CFG
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AnalogCard>
  );
}
