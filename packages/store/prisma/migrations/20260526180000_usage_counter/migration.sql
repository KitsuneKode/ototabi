-- CreateTable
CREATE TABLE "usage_counter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL DEFAULT '',
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_counter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usage_counter_userId_kind_idx" ON "usage_counter"("userId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "usage_counter_userId_kind_periodKey_key" ON "usage_counter"("userId", "kind", "periodKey");

-- AddForeignKey
ALTER TABLE "usage_counter" ADD CONSTRAINT "usage_counter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
