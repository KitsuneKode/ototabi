export type ScheduleTranscriptResult =
  | { status: "queued" }
  | { status: "already_ready" }
  | { status: "waiting_for_upload" }
  | { status: "session_not_complete" };

export function evaluateScheduleTranscript(input: {
  sessionStatus: string | undefined;
  transcriptStatus: string;
  hasSegments: boolean;
  hasAudioKey: boolean;
  force?: boolean;
}): ScheduleTranscriptResult {
  if (input.sessionStatus !== "COMPLETED") {
    return { status: "session_not_complete" };
  }
  if (
    input.hasSegments &&
    !input.force &&
    (input.transcriptStatus === "ready" || input.transcriptStatus === "skipped")
  ) {
    return { status: "already_ready" };
  }
  if (!input.hasAudioKey) {
    return { status: "waiting_for_upload" };
  }
  return { status: "queued" };
}
