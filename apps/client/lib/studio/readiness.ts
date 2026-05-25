export type ReadinessLevel = "ok" | "warn" | "block";

export type ReadinessFinding = {
  level: ReadinessLevel;
  code: string;
  message: string;
};

export type BrowserSupportInput = {
  hasMediaDevices: boolean;
  hasMediaRecorder: boolean;
  hasIndexedDB: boolean;
  isSecureContext: boolean;
};

export type StorageQuotaInput = {
  supported: boolean;
  quotaBytes: number | null;
  usageBytes: number | null;
  /** Minimum recommended free space for local chunk buffering (50 MiB). */
  minFreeBytes?: number;
};

export type DeviceReadinessInput = {
  audioInputCount: number;
  videoInputCount: number;
  audioEnabled: boolean;
  videoEnabled: boolean;
  micPermissionDenied: boolean;
  cameraPermissionDenied: boolean;
};

const DEFAULT_MIN_FREE_BYTES = 50 * 1024 * 1024;

export function evaluateBrowserSupport(input: BrowserSupportInput): ReadinessFinding[] {
  const findings: ReadinessFinding[] = [];

  if (!input.isSecureContext) {
    findings.push({
      level: "block",
      code: "insecure_context",
      message: "Studio recording requires HTTPS or localhost.",
    });
  }

  if (!input.hasMediaDevices) {
    findings.push({
      level: "block",
      code: "no_media_devices",
      message: "This browser does not expose camera or microphone APIs.",
    });
  }

  if (!input.hasMediaRecorder) {
    findings.push({
      level: "block",
      code: "no_media_recorder",
      message: "MediaRecorder is not available — local track capture cannot run.",
    });
  }

  if (!input.hasIndexedDB) {
    findings.push({
      level: "warn",
      code: "no_indexeddb",
      message: "IndexedDB is unavailable; crash recovery for uploads may be limited.",
    });
  }

  if (findings.length === 0) {
    findings.push({
      level: "ok",
      code: "browser_ok",
      message: "Browser supports studio recording.",
    });
  }

  return findings;
}

export function evaluateStorageQuota(input: StorageQuotaInput): ReadinessFinding[] {
  if (!input.supported) {
    return [
      {
        level: "warn",
        code: "storage_estimate_unavailable",
        message: "Could not estimate disk space; recording may fail if storage is full.",
      },
    ];
  }

  const minFree = input.minFreeBytes ?? DEFAULT_MIN_FREE_BYTES;
  const quota = input.quotaBytes ?? 0;
  const usage = input.usageBytes ?? 0;
  const free = quota > 0 ? Math.max(quota - usage, 0) : null;

  if (free === null) {
    return [
      {
        level: "warn",
        code: "storage_unknown",
        message: "Storage quota unknown; ensure several hundred MB free for local buffers.",
      },
    ];
  }

  if (free < minFree / 4) {
    return [
      {
        level: "block",
        code: "storage_critical",
        message: "Very low disk space — free storage before entering the studio.",
      },
    ];
  }

  if (free < minFree) {
    return [
      {
        level: "warn",
        code: "storage_low",
        message: "Disk space is low; long recordings may fail to buffer locally.",
      },
    ];
  }

  return [
    {
      level: "ok",
      code: "storage_ok",
      message: "Enough local storage for studio buffering.",
    },
  ];
}

export function evaluateDevices(input: DeviceReadinessInput): ReadinessFinding[] {
  const findings: ReadinessFinding[] = [];

  if (input.micPermissionDenied) {
    findings.push({
      level: "block",
      code: "mic_denied",
      message: "Microphone permission denied — allow mic access to join with audio.",
    });
  } else if (input.audioEnabled && input.audioInputCount === 0) {
    findings.push({
      level: "warn",
      code: "no_mic",
      message: "No microphone detected; you can still join muted.",
    });
  }

  if (input.cameraPermissionDenied) {
    findings.push({
      level: "warn",
      code: "camera_denied",
      message: "Camera permission denied — video will be off until you allow access.",
    });
  } else if (input.videoEnabled && input.videoInputCount === 0) {
    findings.push({
      level: "warn",
      code: "no_camera",
      message: "No camera detected; you can still join with audio only.",
    });
  }

  if (findings.length === 0) {
    findings.push({
      level: "ok",
      code: "devices_ok",
      message: "Selected devices look ready.",
    });
  }

  return findings;
}

export function aggregateReadiness(findings: ReadinessFinding[]): {
  findings: ReadinessFinding[];
  hasBlock: boolean;
  hasWarn: boolean;
  canEnter: boolean;
} {
  const hasBlock = findings.some((f) => f.level === "block");
  const hasWarn = findings.some((f) => f.level === "warn");
  return {
    findings,
    hasBlock,
    hasWarn,
    canEnter: !hasBlock,
  };
}

export function mergeReadiness(
  ...groups: ReadinessFinding[][]
): ReturnType<typeof aggregateReadiness> {
  return aggregateReadiness(groups.flat());
}
