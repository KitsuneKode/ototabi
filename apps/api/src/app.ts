import { toNodeHandler, auth } from "@ototabi/auth/server";
import { expressMiddleWare } from "@ototabi/trpc";
import cors, { type CorsOptions } from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import { timingMiddleWare } from "@/middlewares/timing-middleware";
import dodoWebhookRouter from "@/routes/dodo-webhook";
import guestAuthRouter from "@/routes/guest-auth";
import liveKitAuthRouter from "@/routes/live-kit-auth";
import config from "@/utils/config";

import { errorHandler } from "./middlewares/error-handler-middleware";

const app = express();

const isDev = config.getConfig("nodeEnv") === "development";

const allowedOrigins = new Set(
  [
    config.getConfig("frontendUrl"),
    "http://localhost:3000",
    "http://localhost:8080",
    ...(config.getConfig("allowedOrigins")
      ? config
          .getConfig("allowedOrigins")
          .split(",")
          .map((s: string) => s.trim())
      : []),
  ].filter(Boolean),
);

const corsOptions: CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin || isDev || allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-trpc-source"],
};

app.use(cors(corsOptions));
app.use(helmet());

// Better Auth handler must come BEFORE express.json()
// https://www.better-auth.com/docs/integrations/express
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

// Rate limiter for guest auth (abuse prevention)
const guestAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many guest sessions, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/guest-auth", guestAuthLimiter, guestAuthRouter);
app.use("/api/dodo-webhook", dodoWebhookRouter);

const liveKitTokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many LiveKit token requests, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(timingMiddleWare);

app.use("/api/trpc", expressMiddleWare);

app.use("/api/token", liveKitTokenLimiter);
app.use("/api/", liveKitAuthRouter);

app.use(errorHandler);

export default app;
