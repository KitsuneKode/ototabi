-- AlterTable
ALTER TABLE "recording_session" ADD COLUMN "transcriptStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "recording_session" ADD COLUMN "transcriptError" TEXT;
ALTER TABLE "recording_session" ADD COLUMN "llmStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "recording_session" ADD COLUMN "llmError" TEXT;
ALTER TABLE "recording_session" ADD COLUMN "clipsStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "recording_session" ADD COLUMN "clipsError" TEXT;
