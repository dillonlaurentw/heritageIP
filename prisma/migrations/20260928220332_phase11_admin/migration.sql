-- AlterTable
ALTER TABLE "AgentRun" ADD COLUMN     "cacheWriteTokens" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Hub" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "featuredAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Hub_featured_idx" ON "Hub"("featured");
