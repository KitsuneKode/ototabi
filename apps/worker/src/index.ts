import { getWorkerConnection } from "@ototabi/jobs/queues";
import { Worker } from "bullmq";

import { processClipsJob } from "@/processors/clips";
import { processExportJob } from "@/processors/export-render";
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

const clipsWorker = new Worker("clips", processClipsJob, {
  connection,
  concurrency: 1,
});

const exportWorker = new Worker("export", processExportJob, {
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
clipsWorker.on("completed", (job) => {
  console.log(`[Worker] Clips job ${job.id} completed for session ${job.data.sessionId}`);
});

clipsWorker.on("failed", (job, err) => {
  console.error(`[Worker] Clips job ${job?.id} failed:`, err.message);
});

exportWorker.on("completed", (job) => {
  console.log(`[Worker] Export job ${job.id} completed`);
});

exportWorker.on("failed", (job, err) => {
  console.error(`[Worker] Export job ${job?.id} failed:`, err.message);
});

console.log("[Worker] Queues: transcript, llm, clips, export");

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[Worker] Shutting down...");
  await transcriptWorker.close();
  await llmWorker.close();
  await clipsWorker.close();
  await exportWorker.close();
  process.exit(0);
});
