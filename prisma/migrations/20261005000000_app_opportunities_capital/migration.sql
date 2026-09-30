-- CreateEnum
CREATE TYPE "OpportunityKind" AS ENUM ('DINNER', 'TRIP', 'WORKSHOP', 'EVENT', 'INTRO_DAY');

-- CreateEnum
CREATE TYPE "OpportunityRequestStatus" AS ENUM ('PENDING', 'PICKED', 'NOT_THIS_TIME', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "kind" "OpportunityKind" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "seats" INTEGER NOT NULL,
    "forWho" TEXT NOT NULL,
    "fields" TEXT[],
    "stages" TEXT[],
    "buildingOnly" BOOLEAN NOT NULL DEFAULT false,
    "costNote" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityRequest" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "why" TEXT NOT NULL,
    "status" "OpportunityRequestStatus" NOT NULL DEFAULT 'PENDING',
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FounderUpdate" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FounderUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "backerId" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Opportunity_startsAt_idx" ON "Opportunity"("startsAt");

-- CreateIndex
CREATE INDEX "OpportunityRequest_userId_idx" ON "OpportunityRequest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityRequest_opportunityId_userId_key" ON "OpportunityRequest"("opportunityId", "userId");

-- CreateIndex
CREATE INDEX "FounderUpdate_authorId_createdAt_idx" ON "FounderUpdate"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "Follow_founderId_idx" ON "Follow"("founderId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_backerId_founderId_key" ON "Follow"("backerId", "founderId");

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityRequest" ADD CONSTRAINT "OpportunityRequest_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityRequest" ADD CONSTRAINT "OpportunityRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FounderUpdate" ADD CONSTRAINT "FounderUpdate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_backerId_fkey" FOREIGN KEY ("backerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

