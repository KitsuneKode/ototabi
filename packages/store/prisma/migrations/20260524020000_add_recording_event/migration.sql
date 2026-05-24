-- CreateTable
CREATE TABLE "recording_event" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "trackSid" TEXT,
    "message" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recording_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recording_event_sessionId_occurredAt_idx" ON "recording_event"("sessionId", "occurredAt");

-- CreateIndex
CREATE INDEX "recording_event_sessionId_type_idx" ON "recording_event"("sessionId", "type");

-- AddForeignKey
ALTER TABLE "recording_event" ADD CONSTRAINT "recording_event_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "recording_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recording_event" ADD CONSTRAINT "recording_event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
