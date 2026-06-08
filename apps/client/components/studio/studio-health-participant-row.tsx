"use client";

import type {
  StudioConnectionUiStatus,
  StudioConsentUiStatus,
  StudioRecoveryUiHint,
  StudioUploadUiStatus,
} from "@ototabi/trpc/studio-health";

import {
  connectionLed,
  consentLabel,
  recoveryLabel,
  uploadLabel,
} from "@/components/studio/studio-health-labels";
import { AnalogInset } from "@/components/ui/analog-card";
import { LedInline } from "@/components/ui/led";
import { MonoLabel, StatusBadge } from "@/components/ui/retro-primitives";

export type StudioHealthParticipantRowData = {
  key: string;
  label: string;
  isLocal: boolean;
  consent: StudioConsentUiStatus;
  uploadStatus: StudioUploadUiStatus;
  recovery: StudioRecoveryUiHint;
  connection: StudioConnectionUiStatus;
  deviceSummary: string;
  uploadDetail: string;
};

type StudioHealthParticipantRowProps = {
  row: StudioHealthParticipantRowData;
  localPendingTracks: number;
};

export function StudioHealthParticipantRow({
  row,
  localPendingTracks,
}: StudioHealthParticipantRowProps) {
  return (
    <li>
      <AnalogInset className="flex flex-col gap-2.5 p-3">
        <StudioHealthParticipantHeader
          label={row.label}
          isLocal={row.isLocal}
          connection={row.connection}
        />
        <StudioHealthMetricGrid row={row} />
        <StudioHealthParticipantDetails
          deviceSummary={row.deviceSummary}
          uploadDetail={row.uploadDetail}
          recovery={row.recovery}
          localPendingTracks={localPendingTracks}
        />
      </AnalogInset>
    </li>
  );
}

type StudioHealthParticipantHeaderProps = {
  label: string;
  isLocal: boolean;
  connection: StudioConnectionUiStatus;
};

function StudioHealthParticipantHeader({
  label,
  isLocal,
  connection,
}: StudioHealthParticipantHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="truncate font-mono text-[10px] font-bold tracking-wide uppercase">
        {label}
      </span>
      <div className="flex shrink-0 items-center gap-1.5">
        {isLocal ? <MonoLabel className="text-[9px]">YOU</MonoLabel> : null}
        <LedInline color={connectionLed[connection]} size="sm" />
      </div>
    </div>
  );
}

type StudioHealthMetricGridProps = {
  row: StudioHealthParticipantRowData;
};

function StudioHealthMetricGrid({ row }: StudioHealthMetricGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2 font-mono text-[9px] tracking-wide uppercase">
      <HealthMetricCell
        label="Link"
        badgeVariant={row.connection === "connected" ? "ok" : "warn"}
        value={row.connection}
      />
      <HealthMetricCell
        label="Upload"
        badgeVariant={
          row.uploadStatus === "complete"
            ? "ok"
            : row.uploadStatus === "stalled"
              ? "warn"
              : "default"
        }
        value={uploadLabel[row.uploadStatus]}
      />
      <HealthMetricCell
        label="Consent"
        badgeVariant={
          row.consent === "granted" ? "ok" : row.consent === "pending" ? "warn" : "default"
        }
        value={consentLabel[row.consent]}
      />
      <HealthMetricCell
        label="Recovery"
        badgeVariant={row.recovery === "recoverable" ? "warn" : "default"}
        value={recoveryLabel[row.recovery]}
      />
    </div>
  );
}

type HealthMetricCellProps = {
  label: string;
  badgeVariant: "ok" | "warn" | "default";
  value: string;
};

function HealthMetricCell({ label, badgeVariant, value }: HealthMetricCellProps) {
  return (
    <div>
      <MonoLabel className="text-muted-foreground mb-0.5 block text-[8px]">{label}</MonoLabel>
      <StatusBadge variant={badgeVariant}>{value}</StatusBadge>
    </div>
  );
}

type StudioHealthParticipantDetailsProps = {
  deviceSummary: string;
  uploadDetail: string;
  recovery: StudioRecoveryUiHint;
  localPendingTracks: number;
};

function StudioHealthParticipantDetails({
  deviceSummary,
  uploadDetail,
  recovery,
  localPendingTracks,
}: StudioHealthParticipantDetailsProps) {
  return (
    <div className="text-muted-foreground/80 space-y-1 font-mono text-[9px] leading-snug">
      <p className="truncate uppercase">{deviceSummary}</p>
      <p className="truncate uppercase">{uploadDetail}</p>
      {recovery === "recoverable" ? (
        <p className="text-yellow-600 dark:text-yellow-400">
          Local OPFS has {localPendingTracks} pending track
          {localPendingTracks === 1 ? "" : "s"} — open Recovery console after session.
        </p>
      ) : null}
    </div>
  );
}
