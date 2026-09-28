-- CreateTable
CREATE TABLE "GtmWorkspace" (
    "id" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "positioning" TEXT,
    "customers" TEXT,
    "channels" TEXT,
    "launchPlan" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GtmWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GtmWorkspace_hubId_key" ON "GtmWorkspace"("hubId");

-- AddForeignKey
ALTER TABLE "GtmWorkspace" ADD CONSTRAINT "GtmWorkspace_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "Hub"("id") ON DELETE CASCADE ON UPDATE CASCADE;
