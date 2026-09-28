-- CreateEnum
CREATE TYPE "SimulationStatus" AS ENUM ('RUNNING', 'DONE', 'CANCELLED');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "persona" TEXT,
ADD COLUMN     "personaUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "simOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "simOptInAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Simulation" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "hubId" TEXT,
    "scenarioKey" TEXT NOT NULL,
    "scenarioTitle" TEXT NOT NULL,
    "scenarioBrief" TEXT NOT NULL,
    "status" "SimulationStatus" NOT NULL DEFAULT 'RUNNING',
    "maxTurns" INTEGER NOT NULL,
    "turnCount" INTEGER NOT NULL DEFAULT 0,
    "demo" BOOLEAN NOT NULL DEFAULT false,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "Simulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationParticipant" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "personaSnapshot" TEXT NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationTurn" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "participantId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulationTurn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FitReport" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "aligned" TEXT[],
    "clashed" TEXT[],
    "talkAbout" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FitReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Simulation_createdById_createdAt_idx" ON "Simulation"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "SimulationParticipant_userId_idx" ON "SimulationParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SimulationParticipant_simulationId_userId_key" ON "SimulationParticipant"("simulationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SimulationTurn_simulationId_index_key" ON "SimulationTurn"("simulationId", "index");

-- CreateIndex
CREATE UNIQUE INDEX "FitReport_simulationId_key" ON "FitReport"("simulationId");

-- AddForeignKey
ALTER TABLE "Simulation" ADD CONSTRAINT "Simulation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simulation" ADD CONSTRAINT "Simulation_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "Hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationParticipant" ADD CONSTRAINT "SimulationParticipant_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "Simulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationParticipant" ADD CONSTRAINT "SimulationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationTurn" ADD CONSTRAINT "SimulationTurn_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "Simulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationTurn" ADD CONSTRAINT "SimulationTurn_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "SimulationParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FitReport" ADD CONSTRAINT "FitReport_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "Simulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
