-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "collabEpoch" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "collabSeeded" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PageUpdate" (
    "id" SERIAL NOT NULL,
    "pageId" TEXT NOT NULL,
    "epoch" INTEGER NOT NULL,
    "update" BYTEA NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagePresence" (
    "pageId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "state" BYTEA NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PagePresence_pkey" PRIMARY KEY ("pageId","clientId")
);

-- CreateIndex
CREATE INDEX "PageUpdate_pageId_epoch_id_idx" ON "PageUpdate"("pageId", "epoch", "id");

-- CreateIndex
CREATE INDEX "PagePresence_pageId_updatedAt_idx" ON "PagePresence"("pageId", "updatedAt");

-- AddForeignKey
ALTER TABLE "PageUpdate" ADD CONSTRAINT "PageUpdate_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagePresence" ADD CONSTRAINT "PagePresence_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagePresence" ADD CONSTRAINT "PagePresence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

