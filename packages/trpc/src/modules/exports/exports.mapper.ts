import type { ExportableAssetDto } from "./exports.dto";
import type { exportsRepository } from "./exports.repository";

type SessionRecord = NonNullable<Awaited<ReturnType<typeof exportsRepository.findSessionForActor>>>;

type ExportContext = Awaited<ReturnType<typeof exportsRepository.loadExportContext>>;

function trackFilename(track: SessionRecord["tracks"][number]): string {
  const type = track.type.toLowerCase();
  const sid = track.trackSid.replace(/[^a-z0-9_-]/gi, "_");
  return `${type}_${sid}.webm`;
}

function mapTrackStatus(track: SessionRecord["tracks"][number]): ExportableAssetDto["status"] {
  if (track.status === "COMPLETED" && (track.s3Key.length > 0 || track.s3Url != null)) {
    return "ready";
  }
  if (track.status === "UPLOADING") return "processing";
  if (track.status === "COMPLETED") return "unavailable";
  return "pending";
}

function mapSessionExportStatus(
  status: string | undefined,
  s3Key: string | null | undefined,
): ExportableAssetDto["status"] {
  if (status === "ready" && s3Key) return "ready";
  if (status === "processing") return "processing";
  if (status === "failed") return "unavailable";
  return "pending";
}

export function mapExportableAssets(
  session: SessionRecord,
  ctx: ExportContext,
): ExportableAssetDto[] {
  const assets: ExportableAssetDto[] = [];

  for (const track of session.tracks) {
    assets.push({
      id: `track:${track.id}`,
      kind: "track",
      label: `${track.type} — ${track.user?.name ?? "Participant"}`,
      status: mapTrackStatus(track),
      filename: mapTrackStatus(track) === "ready" ? trackFilename(track) : null,
      s3Key: track.s3Key || track.s3Url,
      error: track.status === "FAILED" ? "Upload failed" : null,
    });
  }

  const ef = ctx.exportFields;
  assets.push({
    id: "session-export:episode_mp3",
    kind: "session_episode_mp3",
    label: "Episode MP3 (full session)",
    status: mapSessionExportStatus(ef?.episodeMp3Status, ef?.episodeMp3S3Key),
    filename: "session_episode.mp3",
    s3Key: ef?.episodeMp3S3Key ?? null,
    error: ef?.episodeMp3Error ?? null,
  });

  assets.push({
    id: "session-export:landscape_16_9",
    kind: "session_landscape",
    label: "Landscape 16:9 (full session)",
    status: mapSessionExportStatus(ef?.landscapeStatus, ef?.landscapeS3Key),
    filename: "session_landscape_16x9.mp4",
    s3Key: ef?.landscapeS3Key ?? null,
    error: ef?.landscapeError ?? null,
  });

  for (const clip of ctx.clipCandidates) {
    const ready = clip.renderStatus === "ready" && !!clip.renderS3Key;
    assets.push({
      id: `clip:${clip.id}`,
      kind: "clip",
      label: `Clip ${clip.startTime.toFixed(0)}s–${clip.endTime.toFixed(0)}s (9:16)`,
      status: ready
        ? "ready"
        : clip.renderStatus === "processing"
          ? "processing"
          : clip.renderStatus === "failed"
            ? "unavailable"
            : "pending",
      filename: ready ? `clip_${clip.id}_9x16.mp4` : null,
      s3Key: clip.renderS3Key,
      error: clip.renderError,
    });
  }

  const hasTranscript = ctx.transcriptSegments.length > 0;
  assets.push({
    id: "transcript:json",
    kind: "transcript_json",
    label: "Transcript (JSON)",
    status: hasTranscript ? "ready" : "pending",
    filename: "transcript.json",
    s3Key: null,
    error: null,
  });

  return assets;
}

export function buildTranscriptJson(
  sessionId: string,
  segments: ExportContext["transcriptSegments"],
): string {
  return JSON.stringify({ sessionId, segments }, null, 2);
}
