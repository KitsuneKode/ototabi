export type RegenBlockReason =
  | "session_not_complete"
  | "no_transcript"
  | "transcript_not_ready"
  | "pipeline_busy"
  | "ok";

export type RegenGateResult = { allowed: true } | { allowed: false; reason: RegenBlockReason };

function isBusy(status: string): boolean {
  return status === "processing";
}

/** Whether the host can queue LLM regen (chapters + show notes). */
export function evaluateRegenerateLlm(params: {
  sessionStatus: string;
  transcriptDbStatus: string;
  llmDbStatus: string;
  hasTranscriptSegments: boolean;
}): RegenGateResult {
  if (params.sessionStatus !== "COMPLETED") {
    return { allowed: false, reason: "session_not_complete" };
  }

  const transcriptReady = params.hasTranscriptSegments || params.transcriptDbStatus === "ready";

  if (!transcriptReady) {
    return {
      allowed: false,
      reason: params.transcriptDbStatus === "processing" ? "transcript_not_ready" : "no_transcript",
    };
  }

  if (isBusy(params.llmDbStatus)) {
    return { allowed: false, reason: "pipeline_busy" };
  }

  return { allowed: true };
}

/** Whether the host can queue clip candidate regen (uses clips.regenerate). */
export function evaluateRegenerateClips(params: {
  sessionStatus: string;
  transcriptDbStatus: string;
  llmDbStatus: string;
  clipsDbStatus: string;
  hasTranscriptSegments: boolean;
}): RegenGateResult {
  if (params.sessionStatus !== "COMPLETED") {
    return { allowed: false, reason: "session_not_complete" };
  }

  const transcriptReady = params.hasTranscriptSegments || params.transcriptDbStatus === "ready";

  if (!transcriptReady) {
    return {
      allowed: false,
      reason: params.transcriptDbStatus === "processing" ? "transcript_not_ready" : "no_transcript",
    };
  }

  if (isBusy(params.llmDbStatus) || isBusy(params.clipsDbStatus)) {
    return { allowed: false, reason: "pipeline_busy" };
  }

  if (params.llmDbStatus === "pending" && !params.hasTranscriptSegments) {
    return { allowed: false, reason: "transcript_not_ready" };
  }

  return { allowed: true };
}

export function regenBlockMessage(reason: RegenBlockReason): string {
  switch (reason) {
    case "session_not_complete":
      return "Finish and upload the session before regenerating AI artifacts.";
    case "no_transcript":
      return "Run transcript first — chapters and show notes need spoken content.";
    case "transcript_not_ready":
      return "Transcript is still processing. Try again when it completes.";
    case "pipeline_busy":
      return "AI pipeline is already running for this session.";
    case "ok":
      return "";
  }
}
