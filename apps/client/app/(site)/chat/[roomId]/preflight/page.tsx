"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { JoinShell } from "@/components/layout/join-shell";
import { AnalogCard, AnalogInset } from "@/components/ui/analog-card";
import { LedInline } from "@/components/ui/led";
import { MonoLabel, MechButton, PanelTitle, StatusBadge } from "@/components/ui/retro-primitives";
import { AlertTriangle, ArrowRight, CheckCircle, RefreshCw } from "@/lib/icons";
import {
  aggregateReadiness,
  evaluateBrowserSupport,
  evaluateDevices,
  evaluateStorageQuota,
  type ReadinessFinding,
} from "@/lib/studio/readiness";
import { useTRPC } from "@/trpc/client";

function PreflightPageContent() {
  const { roomId } = useParams() as { roomId: string };
  const searchParams = useSearchParams();
  const router = useRouter();
  const trpc = useTRPC();

  const [findings, setFindings] = useState<ReadinessFinding[]>([]);
  const [checking, setChecking] = useState(true);

  const {
    data: authStateData,
    isLoading: authStateIsLoading,
    error: _authStateError,
    refetch: _authStateRefetch,
    isFetching: _authStateIsFetching,
    isPending: _authStateIsPending,
    isSuccess: _authStateIsSuccess,
    isError: _authStateIsError,
    status: _authStateStatus,
  } = useQuery(trpc.auth.getSession.queryOptions());
  const {
    data: roomInfoData,
    isLoading: roomInfoIsLoading,
    error: roomInfoError,
    refetch: _roomInfoRefetch,
    isFetching: _roomInfoIsFetching,
    isPending: _roomInfoIsPending,
    isSuccess: _roomInfoIsSuccess,
    isError: _roomInfoIsError,
    status: _roomInfoStatus,
  } = useQuery(trpc.rooms.getRoomByCode.queryOptions({ code: roomId }, { enabled: !!roomId }));

  const audioEnabled = searchParams.get("audioEnabled") === "true";
  const videoEnabled = searchParams.get("videoEnabled") === "true";
  const screenShareEnabled = searchParams.get("screenShareEnabled") === "true";
  const inviteToken = searchParams.get("invite") || "";
  const micId = searchParams.get("micId") || "";
  const camId = searchParams.get("camId") || "";
  const quality = searchParams.get("quality") || "720p";

  useEffect(() => {
    let cancelled = false;

    const runChecks = async () => {
      setChecking(true);
      const browser = evaluateBrowserSupport({
        hasMediaDevices: typeof navigator !== "undefined" && !!navigator.mediaDevices,
        hasMediaRecorder: typeof MediaRecorder !== "undefined",
        hasIndexedDB: typeof indexedDB !== "undefined",
        isSecureContext:
          typeof window !== "undefined" &&
          (window.isSecureContext || window.location.hostname === "localhost"),
      });

      let storage = evaluateStorageQuota({ supported: false, quotaBytes: null, usageBytes: null });
      if (navigator.storage?.estimate) {
        try {
          const est = await navigator.storage.estimate();
          storage = evaluateStorageQuota({
            supported: true,
            quotaBytes: est.quota ?? null,
            usageBytes: est.usage ?? null,
          });
        } catch {
          storage = evaluateStorageQuota({ supported: false, quotaBytes: null, usageBytes: null });
        }
      }

      let audioInputCount = 0;
      let videoInputCount = 0;
      let micPermissionDenied = false;
      let cameraPermissionDenied = false;

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        audioInputCount = devices.filter((d) => d.kind === "audioinput").length;
        videoInputCount = devices.filter((d) => d.kind === "videoinput").length;
      } catch {
        micPermissionDenied = audioEnabled;
        cameraPermissionDenied = videoEnabled;
      }

      if (audioEnabled || videoEnabled) {
        try {
          const probe = await navigator.mediaDevices.getUserMedia({
            audio: audioEnabled,
            video: videoEnabled,
          });
          probe.getTracks().forEach((t) => t.stop());
          const devices = await navigator.mediaDevices.enumerateDevices();
          audioInputCount = devices.filter((d) => d.kind === "audioinput").length;
          videoInputCount = devices.filter((d) => d.kind === "videoinput").length;
        } catch {
          if (audioEnabled) micPermissionDenied = true;
          if (videoEnabled) cameraPermissionDenied = true;
        }
      }

      const devices = evaluateDevices({
        audioInputCount,
        videoInputCount,
        audioEnabled,
        videoEnabled,
        micPermissionDenied,
        cameraPermissionDenied,
      });

      if (!cancelled) {
        setFindings([...browser, ...storage, ...devices]);
        setChecking(false);
      }
    };

    void runChecks();
    return () => {
      cancelled = true;
    };
  }, [audioEnabled, videoEnabled]);

  const summary = useMemo(() => aggregateReadiness(findings), [findings]);

  const continueToStudio = () => {
    const params = new URLSearchParams({
      audioEnabled: String(audioEnabled),
      videoEnabled: String(videoEnabled),
      screenShareEnabled: String(screenShareEnabled),
      quality,
      micId,
      camId,
      preflight: "done",
    });
    if (inviteToken) params.set("invite", inviteToken);
    router.push(`/chat/${roomId}?${params.toString()}`);
  };

  if (!authStateIsLoading && !authStateData) {
    router.push("/auth/signin");
    return null;
  }

  if (roomInfoIsLoading || checking) {
    return (
      <div className="bg-background flex min-h-[100dvh] items-center justify-center font-sans">
        <RefreshCw className="text-accent h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (roomInfoError || !roomInfoData) {
    return (
      <div className="bg-background flex min-h-[100dvh] items-center justify-center px-4">
        <AnalogCard className="max-w-sm p-8 text-center">
          <AlertTriangle className="text-led-on mx-auto mb-4 h-10 w-10" />
          <MonoLabel className="text-led-on block">Room not found</MonoLabel>
        </AnalogCard>
      </div>
    );
  }

  return (
    <JoinShell title="Studio preflight" subtitle={`Room: ${roomInfoData.name} // readiness checks`}>
      <AnalogCard className="space-y-6 p-6 md:p-8">
        <PanelTitle label="Trust" title="Readiness check" className="mb-2" />
        <p className="text-muted-foreground font-mono text-xs leading-relaxed">
          Warnings are advisory. Critical issues block entering the studio until resolved.
        </p>

        <ul className="space-y-2" aria-label="Preflight findings">
          {findings.map((f) => (
            <li key={f.code}>
              <AnalogInset className="flex items-start gap-3 p-3">
                {f.level === "ok" ? (
                  <CheckCircle className="text-led-green mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle
                    className={`mt-0.5 h-4 w-4 shrink-0 ${f.level === "block" ? "text-led-on" : "text-yellow-500"}`}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <StatusBadge
                      variant={f.level === "ok" ? "ok" : f.level === "block" ? "recording" : "warn"}
                      className="text-[9px]"
                    >
                      {f.level.toUpperCase()}
                    </StatusBadge>
                    <MonoLabel className="text-[9px]">{f.code}</MonoLabel>
                  </div>
                  <p className="text-foreground font-mono text-[11px] leading-relaxed">
                    {f.message}
                  </p>
                </div>
              </AnalogInset>
            </li>
          ))}
        </ul>

        <div className="border-border flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <LedInline color={summary.canEnter ? "green" : "red"} pulse={!summary.canEnter} />
            <MonoLabel>
              {summary.canEnter
                ? summary.hasWarn
                  ? "Ready with warnings"
                  : "All checks passed"
                : "Blocked — fix critical issues"}
            </MonoLabel>
          </div>
          <MechButton
            onClick={continueToStudio}
            disabled={!summary.canEnter}
            className="h-11 justify-center gap-2 px-5 text-xs disabled:opacity-40"
          >
            <span>Enter studio</span>
            <ArrowRight className="h-4 w-4" />
          </MechButton>
        </div>
      </AnalogCard>
    </JoinShell>
  );
}

function PreflightFallback() {
  return (
    <JoinShell title="Preflight" subtitle="Running checks…">
      <AnalogCard className="p-8">
        <MonoLabel>Checking browser, storage, and devices…</MonoLabel>
      </AnalogCard>
    </JoinShell>
  );
}

export default function PreflightPage() {
  return (
    <Suspense fallback={<PreflightFallback />}>
      <PreflightPageContent />
    </Suspense>
  );
}
