import { createTRPCRouter } from "../trpc";
import { authRouter } from "./auth";
import { chatRouter } from "./chat";
import { roomsRouter } from "./rooms";
import { uploadsRouter } from "./uploads";
import { userRouter } from "./user";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  rooms: roomsRouter,
  uploads: uploadsRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
