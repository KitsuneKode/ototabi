import { getWorkerConnection } from "@ototabi/jobs/queues";
import { Worker } from "bullmq";

import { processLlmJob } from "@/processors/llm";
import { processTranscriptJob } from "@/processors/transcript";

const connection = getWorkerConnection();

const transcriptWorker = new Worker("transcript", processTranscriptJob, {
  connection,
  concurrency: 2,
});

const llmWorker = new Worker("llm", processLlmJob, {
  connection,
  concurrency: 1,
});

transcriptWorker.on("completed", (job) => {
  console.log(`[Worker] Transcript job ${job.id} completed for session ${job.data.sessionId}`);
});

transcriptWorker.on("failed", (job, err) => {
  console.error(`[Worker] Transcript job ${job?.id} failed:`, err.message);
});

llmWorker.on("completed", (job) => {
  console.log(`[Worker] LLM job ${job.id} completed for session ${job.data.sessionId}`);
});

llmWorker.on("failed", (job, err) => {
  console.error(`[Worker] LLM job ${job?.id} failed:`, err.message);
});

console.log("[Worker] BullMQ worker started. Waiting for jobs...");
console.log("[Worker] Queues: transcript, llm");

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[Worker] Shutting down...");
  await transcriptWorker.close();
  await llmWorker.close();
  process.exit(0);
});
