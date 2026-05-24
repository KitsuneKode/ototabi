-- CreateTable
CREATE TABLE "upload_session" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackSid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPLOADING',
    "parts" JSONB NOT NULL DEFAULT '[]',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "upload_session_s3Key_key" ON "upload_session"("s3Key");

-- CreateIndex
CREATE UNIQUE INDEX "upload_session_sessionId_trackSid_key" ON "upload_session"("sessionId", "trackSid");

-- CreateIndex
CREATE INDEX "upload_session_userId_status_idx" ON "upload_session"("userId", "status");

-- AddForeignKey
ALTER TABLE "upload_session" ADD CONSTRAINT "upload_session_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "recording_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_session" ADD CONSTRAINT "upload_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
