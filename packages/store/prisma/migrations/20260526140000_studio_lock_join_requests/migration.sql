-- AlterTable
ALTER TABLE "room" ADD COLUMN "isLocked" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "studio_join_request" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_join_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "studio_join_request_roomId_status_idx" ON "studio_join_request"("roomId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "studio_join_request_roomId_userId_key" ON "studio_join_request"("roomId", "userId");

-- AddForeignKey
ALTER TABLE "studio_join_request" ADD CONSTRAINT "studio_join_request_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_join_request" ADD CONSTRAINT "studio_join_request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
