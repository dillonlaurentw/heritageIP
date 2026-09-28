-- CreateEnum
CREATE TYPE "RoleStatus" AS ENUM ('OPEN', 'FILLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SignalKind" AS ENUM ('ROLE_INTEREST', 'BACKER_INTEREST', 'MENTOR_REQUEST', 'PARTNER_INTRO');

-- CreateEnum
CREATE TYPE "SignalStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "HubMember" (
    "id" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HubMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleOpening" (
    "id" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "planStepId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "commitment" TEXT NOT NULL,
    "skills" TEXT[],
    "status" "RoleStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleOpening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL,
    "kind" "SignalKind" NOT NULL,
    "status" "SignalStatus" NOT NULL DEFAULT 'PENDING',
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "hubId" TEXT,
    "roleOpeningId" TEXT,
    "planStepId" TEXT,
    "note" TEXT NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Signal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HubMember_hubId_userId_key" ON "HubMember"("hubId", "userId");

-- CreateIndex
CREATE INDEX "RoleOpening_status_createdAt_idx" ON "RoleOpening"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Signal_toUserId_status_idx" ON "Signal"("toUserId", "status");

-- CreateIndex
CREATE INDEX "Signal_fromUserId_status_idx" ON "Signal"("fromUserId", "status");

-- CreateIndex
CREATE INDEX "Signal_hubId_kind_idx" ON "Signal"("hubId", "kind");

-- AddForeignKey
ALTER TABLE "HubMember" ADD CONSTRAINT "HubMember_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "Hub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubMember" ADD CONSTRAINT "HubMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleOpening" ADD CONSTRAINT "RoleOpening_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "Hub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleOpening" ADD CONSTRAINT "RoleOpening_planStepId_fkey" FOREIGN KEY ("planStepId") REFERENCES "PlanStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "Hub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_roleOpeningId_fkey" FOREIGN KEY ("roleOpeningId") REFERENCES "RoleOpening"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_planStepId_fkey" FOREIGN KEY ("planStepId") REFERENCES "PlanStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
