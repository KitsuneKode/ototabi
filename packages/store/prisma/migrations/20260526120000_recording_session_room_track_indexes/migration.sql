-- CreateIndex
CREATE INDEX "room_creatorId_idx" ON "room"("creatorId");

-- CreateIndex
CREATE INDEX "recording_session_roomId_startedAt_idx" ON "recording_session"("roomId", "startedAt");

-- CreateIndex
CREATE INDEX "recording_track_sessionId_idx" ON "recording_track"("sessionId");
