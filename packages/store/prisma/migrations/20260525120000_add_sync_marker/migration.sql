-- CreateTable
CREATE TABLE "sync_marker" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "localTime" DOUBLE PRECISION NOT NULL,
    "rtpTimestamp" DOUBLE PRECISION,
    "trackSid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_marker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sync_marker_sessionId_userId_idx" ON "sync_marker"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "sync_marker_sessionId_createdAt_idx" ON "sync_marker"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "sync_marker" ADD CONSTRAINT "sync_marker_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "recording_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
