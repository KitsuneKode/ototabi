-- AlterTable
ALTER TABLE "clip_candidate" ADD COLUMN "renderError" TEXT;

-- AlterTable
ALTER TABLE "recording_session" ADD COLUMN "episodeMp3Status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN "episodeMp3S3Key" TEXT,
ADD COLUMN "episodeMp3Error" TEXT,
ADD COLUMN "landscapeStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN "landscapeS3Key" TEXT,
ADD COLUMN "landscapeError" TEXT;
