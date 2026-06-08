"use client";

import { Label } from "@ototabi/ui/components/label";

import type { StudioQuality } from "@/lib/studio/quality-presets";

import { JoinMediaDeviceControl } from "@/components/join/join-media-device-control";
import { MonoLabel, MechButton } from "@/components/ui/retro-primitives";
import { ArrowRight, Info, Tv, User } from "@/lib/icons";

type JoinControlsPanelProps = {
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
  audioDevices: MediaDeviceInfo[];
  videoDevices: MediaDeviceInfo[];
  selectedMic: string;
  selectedCam: string;
  micError: string;
  camError: string;
  quality: StudioQuality;
  isSignedIn: boolean;
  guestName: string;
  guestLoading: boolean;
  guestNeedsInvite: boolean;
  onAudioEnabledChange: (value: boolean) => void;
  onVideoEnabledChange: (value: boolean) => void;
  onToggleScreenShare: () => void;
  onSelectedMicChange: (value: string) => void;
  onSelectedCamChange: (value: string) => void;
  onQualityChange: (value: StudioQuality) => void;
  onGuestNameChange: (value: string) => void;
  onJoin: () => void;
};

export function JoinControlsPanel({
  audioEnabled,
  videoEnabled,
  screenShareEnabled,
  audioDevices,
  videoDevices,
  selectedMic,
  selectedCam,
  micError,
  camError,
  quality,
  isSignedIn,
  guestName,
  guestLoading,
  guestNeedsInvite,
  onAudioEnabledChange,
  onVideoEnabledChange,
  onToggleScreenShare,
  onSelectedMicChange,
  onSelectedCamChange,
  onQualityChange,
  onGuestNameChange,
  onJoin,
}: JoinControlsPanelProps) {
  return (
    <div className="flex flex-col justify-between md:col-span-5">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight uppercase">Console Settings</h2>
          <MonoLabel className="mt-0.5 block">Configure your deck inputs</MonoLabel>
        </div>

        <JoinMediaDeviceControl
          id="mic-select"
          label="Microphone Input"
          enabled={audioEnabled}
          onToggle={() => onAudioEnabledChange(!audioEnabled)}
          toggleLabels={{ on: "ENGAGED", off: "MUTED" }}
          toggleAria={{ on: "Mute microphone", off: "Unmute microphone" }}
          devices={audioDevices}
          selectedDevice={selectedMic}
          onDeviceChange={onSelectedMicChange}
          disabledLabel="Mic Stream Terminated"
          error={micError}
        />

        <JoinMediaDeviceControl
          id="cam-select"
          label="Camera Source"
          enabled={videoEnabled}
          onToggle={() => onVideoEnabledChange(!videoEnabled)}
          toggleLabels={{ on: "ENGAGED", off: "MUTED" }}
          toggleAria={{ on: "Turn off camera", off: "Turn on camera" }}
          devices={videoDevices}
          selectedDevice={selectedCam}
          onDeviceChange={onSelectedCamChange}
          disabledLabel="Camera Stream Terminated"
          error={camError}
          deviceKind="videoinput"
        />

        <div className="space-y-2">
          <Label
            htmlFor="quality-select"
            className="text-foreground/80 font-mono text-xs font-bold tracking-wider uppercase"
          >
            Recording Quality
          </Label>
          <select
            id="quality-select"
            value={quality}
            onChange={(e) => onQualityChange(e.target.value as StudioQuality)}
            className="border-border bg-popover text-foreground focus:ring-accent/60 h-10 w-full rounded border px-3 font-mono text-xs shadow-inner focus:ring-1 focus:outline-none"
          >
            <option value="720p">720p HD (1280×720)</option>
            <option value="1080p">1080p Full HD (1920×1080)</option>
            <option value="4k">4K UHD (3840×2160)</option>
          </select>
        </div>

        <div className="space-y-2 pt-1">
          <MonoLabel className="block">Additional Feeds</MonoLabel>
          <button
            type="button"
            onClick={onToggleScreenShare}
            className={`flex h-10 w-full items-center justify-between rounded border px-3 font-mono text-xs font-bold tracking-wider uppercase transition-[border-color,background-color] ${
              screenShareEnabled
                ? "border-accent bg-accent/5 text-accent"
                : "border-border bg-card text-muted-foreground hover:border-border/80"
            }`}
          >
            <div className="flex items-center gap-2">
              <Tv className="h-4 w-4" />
              <span>Screen Capture Link</span>
            </div>
            <div
              className={`flex h-3.5 w-3.5 items-center justify-center rounded border transition-colors ${screenShareEnabled ? "bg-accent border-accent" : "bg-popover border-border"}`}
            >
              {screenShareEnabled ? <div className="h-1.5 w-1.5 rounded-sm bg-white" /> : null}
            </div>
          </button>
        </div>
      </div>

      <div className="border-border mt-6 space-y-4 border-t pt-6">
        {!isSignedIn ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="text-muted-foreground h-4 w-4" />
              <Label
                htmlFor="guest-name"
                className="text-foreground/80 font-mono text-xs font-bold tracking-wider uppercase"
              >
                Your Name
              </Label>
            </div>
            <input
              id="guest-name"
              type="text"
              value={guestName}
              onChange={(e) => onGuestNameChange(e.target.value)}
              aria-label="Your name"
              placeholder="Enter your name to join..."
              className="border-border bg-popover text-foreground placeholder:text-muted-foreground/40 focus:ring-accent/60 h-10 w-full rounded border px-3 font-mono text-sm shadow-inner focus:ring-1 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && guestName.trim()) onJoin();
              }}
            />
          </div>
        ) : null}
        <MechButton
          onClick={onJoin}
          disabled={guestNeedsInvite || (!isSignedIn && (!guestName.trim() || guestLoading))}
          className="h-12 w-full justify-center gap-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          {guestLoading ? (
            <span>Creating Guest Session...</span>
          ) : (
            <>
              <span>{isSignedIn ? "Connect Studio Deck" : "Join as Guest"}</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </MechButton>
        <div className="text-muted-foreground flex items-start gap-2 font-mono text-[9px] leading-relaxed uppercase">
          <Info className="text-accent mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            By joining, you authorize Ototabi to buffer your high-quality tracks inside a secure
            local IndexedDB container for uploading.
          </span>
        </div>
      </div>
    </div>
  );
}
