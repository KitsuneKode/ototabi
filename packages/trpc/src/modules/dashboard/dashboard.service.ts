import { dashboardRepository } from "./dashboard.repository";

function deriveAiStatus(session: {
  status: string;
  _count: { transcriptSegments: number; chapters: number; clipCandidates: number };
  showNotes: { id: string } | null;
}): "pending" | "processing" | "ready" {
  if (session._count.transcriptSegments === 0) {
    return session.status === "COMPLETED" ? "processing" : "pending";
  }
  if (session.showNotes || session._count.chapters > 0 || session._count.clipCandidates > 0) {
    return "ready";
  }
  return "processing";
}

export const dashboardService = {
  async getSummary(userId: string) {
    const raw = await dashboardRepository.getSummaryForHost(userId);
    return {
      ownedRooms: raw.ownedRooms,
      sharedRooms: raw.sharedRooms,
      recentSessions: raw.recentSessions.map((session) => ({
        id: session.id,
        status: session.status,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        room: session.room,
        tracks: session.tracks,
        aiStatus: deriveAiStatus(session),
        hasTranscript: session._count.transcriptSegments > 0,
        hasChapters: session._count.chapters > 0,
        hasShowNotes: !!session.showNotes,
        clipsReady: session._count.clipCandidates > 0,
      })),
    };
  },
};
