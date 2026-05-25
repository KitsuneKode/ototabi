-- AlterTable
ALTER TABLE "recording_session" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'STUDIO';

-- CreateTable
CREATE TABLE "demo_session_data" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "cursorEvents" JSONB NOT NULL DEFAULT '[]',
    "zoomRegions" JSONB NOT NULL DEFAULT '[]',
    "trimStartMs" DOUBLE PRECISION,
    "trimEndMs" DOUBLE PRECISION,
    "background" JSONB NOT NULL DEFAULT '{"type":"solid","value":"#0a0a0a"}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demo_session_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "demo_session_data_sessionId_key" ON "demo_session_data"("sessionId");

-- AddForeignKey
ALTER TABLE "demo_session_data" ADD CONSTRAINT "demo_session_data_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "recording_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
