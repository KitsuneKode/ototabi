export type StudioConsentUiStatus = "granted" | "pending" | "not_required";

export type StudioUploadUiStatus = "idle" | "uploading" | "complete" | "stalled";

export type StudioRecoveryUiHint = "none" | "recoverable" | "active";

export type StudioConnectionUiStatus = "connected" | "reconnecting" | "disconnected" | "unknown";

export type UploadProgressEntry = {
  progress: number;
  uploadedParts?: number;
  totalParts?: number;
};

export function mapConsentUiStatus(params: {
  hasRecordingConsent: boolean;
  sessionRecording: boolean;
}): StudioConsentUiStatus {
  if (!params.sessionRecording) return "not_required";
  return params.hasRecordingConsent ? "granted" : "pending";
}

export function mapUploadQueueUiStatus(entries: UploadProgressEntry[]): StudioUploadUiStatus {
  if (entries.length === 0) return "idle";

  const progresses = entries.map((e) => e.progress);
  const allComplete = progresses.every((p) => p >= 100);
  if (allComplete) return "complete";

  const anyStalled = entries.some(
    (e) =>
      e.progress > 0 &&
      e.progress < 100 &&
      e.totalParts !== undefined &&
      (e.uploadedParts ?? 0) === 0,
  );
  if (anyStalled) return "stalled";

  const anyActive = progresses.some((p) => p > 0 && p < 100);
  if (anyActive) return "uploading";

  return "idle";
}

export function mapRecoveryUiHint(params: {
  pendingLocalTrackCount: number;
  isLocalParticipant: boolean;
}): StudioRecoveryUiHint {
  if (!params.isLocalParticipant) return "none";
  if (params.pendingLocalTrackCount <= 0) return "none";
  return params.pendingLocalTrackCount > 0 ? "recoverable" : "none";
}

export function mapConnectionUiStatus(params: {
  isLocal: boolean;
  localHealth: StudioConnectionUiStatus;
  isPresentInRoom: boolean;
}): StudioConnectionUiStatus {
  if (params.isLocal) return params.localHealth;
  if (!params.isPresentInRoom) return "disconnected";
  return "connected";
}

export function matchParticipantIdentity(
  identity: string,
  candidates: { userId: string; name: string | null; email?: string | null }[],
): string | null {
  const normalized = identity.trim().toLowerCase();
  if (!normalized) return null;

  for (const c of candidates) {
    if (c.userId.toLowerCase() === normalized) return c.userId;
    if (c.name?.trim().toLowerCase() === normalized) return c.userId;
    if (c.email?.trim().toLowerCase() === normalized) return c.userId;
  }
  return null;
}

export function aggregateUploadProgressByIdentity(
  progressEntries: { identity: string; entry: UploadProgressEntry }[],
  identity: string,
): UploadProgressEntry[] {
  const key = identity.trim().toLowerCase();
  return progressEntries
    .filter((row) => row.identity.trim().toLowerCase() === key)
    .map((row) => row.entry);
}
