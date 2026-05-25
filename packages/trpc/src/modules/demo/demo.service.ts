import { TRPCError } from "@trpc/server";

import type { CursorEvent, DemoBackground, ZoomRegion } from "./demo.dto";

import { recordingEventsService } from "../recording-events/recording-events.service";
import { demoPolicy } from "./demo.policy";
import { demoRepository } from "./demo.repository";

function parseZoomRegions(raw: unknown): ZoomRegion[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is ZoomRegion =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as ZoomRegion).id === "string" &&
      typeof (item as ZoomRegion).startMs === "number" &&
      typeof (item as ZoomRegion).endMs === "number" &&
      typeof (item as ZoomRegion).scale === "number",
  );
}

function parseBackground(raw: unknown): DemoBackground {
  if (typeof raw === "object" && raw !== null) {
    const bg = raw as DemoBackground;
    if ((bg.type === "solid" || bg.type === "gradient") && typeof bg.value === "string") {
      return bg;
    }
  }
  return { type: "solid", value: "#0a0a0a" };
}

function parseCursorEvents(raw: unknown): CursorEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw as CursorEvent[];
}

export const demoService = {
  async startDemoSession(params: { actorId: string }) {
    const room = await demoRepository.getOrCreateDemoRoom(params.actorId);
    await demoRepository.endActiveDemoSessions(room.id);
    const session = await demoRepository.createDemoSession(room.id);
    await recordingEventsService.createEvent({
      actorId: params.actorId,
      sessionId: session.id,
      type: "START",
      message: "Demo capture started",
      metadata: { mode: "DEMO" },
    });
    return { sessionId: session.id, roomId: room.id };
  },

  async stopDemoSession(params: {
    actorId: string;
    sessionId: string;
    cursorEvents: CursorEvent[];
  }) {
    const session = await demoRepository.findDemoSessionForActor(params.sessionId, params.actorId);
    if (!demoPolicy.canManageDemoSession(session, params.actorId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized for this demo session" });
    }

    await demoRepository.saveCursorEvents(params.sessionId, params.cursorEvents);
    await demoRepository.markDemoSessionComplete(params.sessionId);
    await recordingEventsService.createEvent({
      actorId: params.actorId,
      sessionId: params.sessionId,
      type: "STOP",
      message: "Demo capture stopped",
      metadata: { cursorEventCount: params.cursorEvents.length },
    });

    return { success: true };
  },

  async getDemoSession(params: { actorId: string; sessionId: string }) {
    const session = await demoRepository.findDemoSessionForActor(params.sessionId, params.actorId);
    if (!demoPolicy.canManageDemoSession(session, params.actorId)) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Demo session not found" });
    }

    const demoData = session.demoData;
    return {
      session: {
        id: session.id,
        status: session.status,
        mode: session.mode,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        room: session.room,
        tracks: session.tracks.map((track) => ({
          id: track.id,
          trackSid: track.trackSid,
          type: track.type,
          status: track.status,
          s3Key: track.s3Key,
          s3Url: track.s3Url,
          user: track.user,
        })),
      },
      demo: {
        cursorEvents: parseCursorEvents(demoData?.cursorEvents),
        zoomRegions: parseZoomRegions(demoData?.zoomRegions),
        trimStartMs: demoData?.trimStartMs ?? null,
        trimEndMs: demoData?.trimEndMs ?? null,
        background: parseBackground(demoData?.background),
      },
    };
  },

  async saveDemoEdit(params: {
    actorId: string;
    sessionId: string;
    zoomRegions: ZoomRegion[];
    trimStartMs?: number | null;
    trimEndMs?: number | null;
    background?: DemoBackground;
  }) {
    const session = await demoRepository.findDemoSessionForActor(params.sessionId, params.actorId);
    if (!demoPolicy.canManageDemoSession(session, params.actorId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized for this demo session" });
    }

    await demoRepository.saveDemoEdit(params.sessionId, {
      zoomRegions: params.zoomRegions,
      trimStartMs: params.trimStartMs,
      trimEndMs: params.trimEndMs,
      background: params.background,
    });

    return { success: true };
  },
};
