-- CreateTable
CREATE TABLE "clip_candidate" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "startTime" DOUBLE PRECISION NOT NULL,
    "endTime" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rationale" TEXT NOT NULL,
    "layout" TEXT NOT NULL DEFAULT 'vertical_9_16',
    "renderStatus" TEXT NOT NULL DEFAULT 'pending',
    "renderS3Key" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clip_candidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clip_candidate_sessionId_score_idx" ON "clip_candidate"("sessionId", "score");

-- AddForeignKey
ALTER TABLE "clip_candidate" ADD CONSTRAINT "clip_candidate_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "recording_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
