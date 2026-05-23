import { chatRouter } from "../modules/chat/chat.router";
import { roomsRouter } from "../modules/rooms/rooms.router";
import { uploadsRouter } from "../modules/uploads/uploads.router";
import { createTRPCRouter } from "../trpc";
import { authRouter } from "./auth";
import { userRouter } from "./user";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  rooms: roomsRouter,
  uploads: uploadsRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
