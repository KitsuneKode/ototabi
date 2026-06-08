import { chatRouter } from "../modules/chat/chat.router";
import { clipsRouter } from "../modules/clips/clips.router";
import { dashboardRouter } from "../modules/dashboard/dashboard.router";
import { demoRouter } from "../modules/demo/demo.router";
import { exportsRouter } from "../modules/exports/exports.router";
import { recordingEventsRouter } from "../modules/recording-events/recording-events.router";
import { recordingsRouter } from "../modules/recordings/recordings.router";
import { roomsRouter } from "../modules/rooms/rooms.router";
import { sessionReviewRouter } from "../modules/session-review/session-review.router";
import { studioAccessRouter } from "../modules/studio-access/studio-access.router";
import { syncMarkersRouter } from "../modules/sync-markers/sync-markers.router";
import { transcriptRouter } from "../modules/transcript/transcript.router";
import { uploadsRouter } from "../modules/uploads/uploads.router";
import { usageRouter } from "../modules/usage/usage.router";
import { createTRPCRouter } from "../trpc";
import { authRouter } from "./auth";
import { billingRouter } from "./billing";
import { userRouter } from "./user";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  billing: billingRouter,
  usage: usageRouter,
  user: userRouter,
  dashboard: dashboardRouter,
  rooms: roomsRouter,
  studioAccess: studioAccessRouter,
  recordings: recordingsRouter,
  uploads: uploadsRouter,
  clips: clipsRouter,
  demo: demoRouter,
  chat: chatRouter,
  recordingEvents: recordingEventsRouter,
  sessionReview: sessionReviewRouter,
  exports: exportsRouter,
  syncMarkers: syncMarkersRouter,
  transcript: transcriptRouter,
});

export type AppRouter = typeof appRouter;
