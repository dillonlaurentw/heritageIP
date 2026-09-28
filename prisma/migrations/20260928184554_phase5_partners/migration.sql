-- CreateEnum
CREATE TYPE "PartnerCategory" AS ENUM ('SUPPLIER', 'LEGAL', 'WEBSITE', 'MARKETING', 'GTM', 'DESIGN', 'FINANCE', 'OTHER');

-- AlterTable
ALTER TABLE "Signal" ADD COLUMN     "partnerId" TEXT;

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categories" "PartnerCategory"[],
    "services" TEXT[],
    "stages" "PlanStage"[],
    "location" TEXT NOT NULL,
    "priceNote" TEXT,
    "website" TEXT,
    "contactEmail" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "claimedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_slug_key" ON "Partner"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_claimedById_key" ON "Partner"("claimedById");

-- CreateIndex
CREATE INDEX "Partner_featured_idx" ON "Partner"("featured");

-- AddForeignKey
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
