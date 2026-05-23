import { Queue, type JobsOptions } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

function createConnection() {
  return new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
}

let transcriptQueue: Queue | null = null;
let llmQueue: Queue | null = null;

const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 5000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 },
};

export function getTranscriptQueue(): Queue {
  if (!transcriptQueue) {
    transcriptQueue = new Queue("transcript", {
      connection: createConnection(),
      defaultJobOptions,
    });
  }
  return transcriptQueue;
}

export function getLlmQueue(): Queue {
  if (!llmQueue) {
    llmQueue = new Queue("llm", { connection: createConnection(), defaultJobOptions });
  }
  return llmQueue;
}

export function getWorkerConnection() {
  return createConnection();
}
