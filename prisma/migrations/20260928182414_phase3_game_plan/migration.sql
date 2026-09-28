-- CreateEnum
CREATE TYPE "PlanStage" AS ENUM ('VALIDATE', 'SETUP', 'BUILD', 'LAUNCH');

-- CreateEnum
CREATE TYPE "NeedTag" AS ENUM ('COFOUNDER', 'SUPPLIER', 'LEGAL', 'FUNDING', 'MARKETING', 'GTM', 'WEBSITE', 'MENTOR');

-- CreateEnum
CREATE TYPE "StepSource" AS ENUM ('AGENT', 'MANUAL');

-- CreateTable
CREATE TABLE "PlanStep" (
    "id" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "stage" "PlanStage" NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "needs" "NeedTag"[],
    "source" "StepSource" NOT NULL DEFAULT 'MANUAL',
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanStep_hubId_stage_position_idx" ON "PlanStep"("hubId", "stage", "position");

-- AddForeignKey
ALTER TABLE "PlanStep" ADD CONSTRAINT "PlanStep_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "Hub"("id") ON DELETE CASCADE ON UPDATE CASCADE;
