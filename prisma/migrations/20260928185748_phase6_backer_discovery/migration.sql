-- AlterTable
ALTER TABLE "Hub" ADD COLUMN     "backerAsk" TEXT,
ADD COLUMN     "discoverable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "discoverableAt" TIMESTAMP(3),
ADD COLUMN     "sector" TEXT;
