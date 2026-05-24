import { chatRouter } from "../modules/chat/chat.router";
import { recordingEventsRouter } from "../modules/recording-events/recording-events.router";
import { roomsRouter } from "../modules/rooms/rooms.router";
import { syncMarkersRouter } from "../modules/sync-markers/sync-markers.router";
import { transcriptRouter } from "../modules/transcript/transcript.router";
import { uploadsRouter } from "../modules/uploads/uploads.router";
import { createTRPCRouter } from "../trpc";
import { authRouter } from "./auth";
import { billingRouter } from "./billing";
import { userRouter } from "./user";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  billing: billingRouter,
  user: userRouter,
  rooms: roomsRouter,
  uploads: uploadsRouter,
  chat: chatRouter,
  recordingEvents: recordingEventsRouter,
  syncMarkers: syncMarkersRouter,
  transcript: transcriptRouter,
});

export type AppRouter = typeof appRouter;
