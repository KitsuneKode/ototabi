import { TRPCError } from "@trpc/server";

import { scheduleTranscriptForSession } from "../../lib/schedule-transcript";
import { recordingEventsService } from "../recording-events/recording-events.service";
import { studioAccessPolicy } from "../studio-access/studio-access.policy";
import { studioAccessRepository } from "../studio-access/studio-access.repository";
import { usageService } from "../usage/usage.service";
import { recordingsPolicy } from "./recordings.policy";
import { recordingsRepository } from "./recordings.repository";

export const recordingsService = {
  async startRecordingSession(params: { actorId: string; roomId: string }) {
    const { room, member, participant } = await studioAccessRepository.findAccessContext(
      params.roomId,
      params.actorId,
    );
    if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
    const hasStudioAccess = studioAccessPolicy.canJoinRoom({
      room,
      userId: params.actorId,
      member,
      participant,
      inviteUsable: false,
    });
    if (!recordingsPolicy.canStartOrStopRecording(hasStudioAccess)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to start recording" });
    }

    await usageService.assertCanStartStudioSession(room.creatorId);

    await recordingsRepository.endActiveSessions(params.roomId);
    const session = await recordingsRepository.createSession(params.roomId);
    await recordingEventsService.createEvent({
      actorId: params.actorId,
      sessionId: session.id,
      type: "START",
      message: "Recording started",
    });
    return session;
  },

  async stopRecordingSession(params: { actorId: string; sessionId: string }) {
    const session = await recordingsRepository.findSession(params.sessionId);
    if (!session)
      throw new TRPCError({ code: "NOT_FOUND", message: "Recording session not found" });
    const canAccess = await recordingsRepository.canUserAccessSession(
      params.sessionId,
      params.actorId,
    );
    if (!recordingsPolicy.canStartOrStopRecording(canAccess)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to stop recording" });
    }
    const result = await recordingsRepository.markSessionComplete(params.sessionId);
    await recordingEventsService.createEvent({
      actorId: params.actorId,
      sessionId: params.sessionId,
      type: "STOP",
      message: "Recording stopped",
    });

    try {
      await scheduleTranscriptForSession(params.sessionId);
    } catch {
      // Transcript queue is optional — don't block session completion
    }

    return result;
  },

  async getRecordingSessions(roomId: string) {
    return recordingsRepository.listSessions(roomId);
  },

  async getRecordingSessionById(sessionId: string) {
    const session = await recordingsRepository.getSessionWithDetails(sessionId);
    if (!session)
      throw new TRPCError({ code: "NOT_FOUND", message: "Recording session not found" });
    return session;
  },

  async listRecentSessions(userId: string) {
    return recordingsRepository.listRecentByCreator(userId);
  },
};
