import type {
  StudioConnectionUiStatus,
  StudioConsentUiStatus,
  StudioRecoveryUiHint,
  StudioUploadUiStatus,
} from "@ototabi/trpc/studio-health";

export const consentLabel: Record<StudioConsentUiStatus, string> = {
  granted: "Consented",
  pending: "Consent needed",
  not_required: "—",
};

export const uploadLabel: Record<StudioUploadUiStatus, string> = {
  idle: "Idle",
  uploading: "Uploading",
  complete: "Complete",
  stalled: "Stalled",
};

export const recoveryLabel: Record<StudioRecoveryUiHint, string> = {
  none: "OK",
  recoverable: "OPFS recovery",
  active: "Recovering",
};

export const connectionLed: Record<
  StudioConnectionUiStatus,
  "green" | "amber" | "red" | "green-off"
> = {
  connected: "green",
  reconnecting: "amber",
  disconnected: "red",
  unknown: "green-off",
};

export function resolveDeviceLabel(deviceId: string, label: string): string {
  if (!deviceId) return "Default";
  if (label) return label.length > 28 ? `${label.slice(0, 25)}…` : label;
  return deviceId.length > 12 ? `…${deviceId.slice(-8)}` : deviceId;
}
