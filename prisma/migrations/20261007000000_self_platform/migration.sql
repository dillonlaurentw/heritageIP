-- CreateEnum
CREATE TYPE "PreferenceStance" AS ENUM ('LIKES', 'AVOIDS');

-- CreateEnum
CREATE TYPE "PreferenceSource" AS ENUM ('STATED', 'OBSERVED');

-- CreateEnum
CREATE TYPE "ShareGrantStatus" AS ENUM ('PENDING', 'ACTIVE', 'DECLINED', 'REVOKED');

-- CreateTable
CREATE TABLE "Sandbox" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sandbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelfService" (
    "id" TEXT NOT NULL,
    "sandboxId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyHint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SelfService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerProfile" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "displayName" TEXT,
    "email" TEXT,
    "consentPersonalization" BOOLEAN NOT NULL DEFAULT false,
    "consentAgents" BOOLEAN NOT NULL DEFAULT false,
    "consentUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preference" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "stance" "PreferenceStance" NOT NULL,
    "source" "PreferenceSource" NOT NULL,
    "evidence" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "lastEvidenceAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerEvent" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "data" JSONB,
    "contextId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContextRequest" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "query" TEXT,
    "returned" JSONB NOT NULL,
    "outcomeAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContextRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareGrant" (
    "id" TEXT NOT NULL,
    "sandboxId" TEXT NOT NULL,
    "toProfileId" TEXT NOT NULL,
    "sourceServiceId" TEXT NOT NULL,
    "fromProfileId" TEXT,
    "categories" TEXT[],
    "reason" TEXT NOT NULL,
    "status" "ShareGrantStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ShareGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelfAuditEntry" (
    "id" TEXT NOT NULL,
    "sandboxId" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "profileId" TEXT,
    "action" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SelfAuditEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sandbox_expiresAt_idx" ON "Sandbox"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SelfService_keyHash_key" ON "SelfService"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "SelfService_sandboxId_slug_key" ON "SelfService"("sandboxId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_serviceId_externalId_key" ON "CustomerProfile"("serviceId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Preference_profileId_category_value_key" ON "Preference"("profileId", "category", "value");

-- CreateIndex
CREATE INDEX "CustomerEvent_profileId_createdAt_idx" ON "CustomerEvent"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "ShareGrant_toProfileId_status_idx" ON "ShareGrant"("toProfileId", "status");

-- CreateIndex
CREATE INDEX "SelfAuditEntry_sandboxId_createdAt_idx" ON "SelfAuditEntry"("sandboxId", "createdAt");

-- AddForeignKey
ALTER TABLE "SelfService" ADD CONSTRAINT "SelfService_sandboxId_fkey" FOREIGN KEY ("sandboxId") REFERENCES "Sandbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "SelfService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preference" ADD CONSTRAINT "Preference_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerEvent" ADD CONSTRAINT "CustomerEvent_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContextRequest" ADD CONSTRAINT "ContextRequest_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "SelfService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContextRequest" ADD CONSTRAINT "ContextRequest_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareGrant" ADD CONSTRAINT "ShareGrant_sandboxId_fkey" FOREIGN KEY ("sandboxId") REFERENCES "Sandbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareGrant" ADD CONSTRAINT "ShareGrant_toProfileId_fkey" FOREIGN KEY ("toProfileId") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareGrant" ADD CONSTRAINT "ShareGrant_sourceServiceId_fkey" FOREIGN KEY ("sourceServiceId") REFERENCES "SelfService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareGrant" ADD CONSTRAINT "ShareGrant_fromProfileId_fkey" FOREIGN KEY ("fromProfileId") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelfAuditEntry" ADD CONSTRAINT "SelfAuditEntry_sandboxId_fkey" FOREIGN KEY ("sandboxId") REFERENCES "Sandbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;
