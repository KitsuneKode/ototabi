import { getS3Client } from "@ototabi/backend-common/s3-media";
import { getWorkerConnection } from "@ototabi/jobs/queues";
import { prisma } from "@ototabi/store";
import { Router } from "express";

import config from "@/utils/config";

const router = Router();

type CheckStatus = "ok" | "error";

async function checkDatabase(): Promise<CheckStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return "ok";
  } catch {
    return "error";
  }
}

async function checkRedis(): Promise<CheckStatus> {
  const connection = getWorkerConnection();
  try {
    const pong = await connection.ping();
    return pong === "PONG" ? "ok" : "error";
  } catch {
    return "error";
  } finally {
    connection.disconnect();
  }
}

function checkS3Config(): CheckStatus {
  const bucket = process.env.AWS_S3_BUCKET_NAME || process.env.MINIO_BUCKET_NAME;
  if (!bucket) return "error";

  const client = getS3Client();
  if (client) return "ok";

  return process.env.NODE_ENV === "development" ? "ok" : "error";
}

router.get("/health", async (_req, res) => {
  const [database, redis] = await Promise.all([checkDatabase(), checkRedis()]);
  const s3 = checkS3Config();
  const healthy = database === "ok" && redis === "ok" && s3 === "ok";

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    checks: { database, redis, s3 },
    service: "ototabi-api",
    environment: config.getConfig("nodeEnv"),
  });
});

export default router;
