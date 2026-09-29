-- CreateEnum
CREATE TYPE "JournalRole" AS ENUM ('ME', 'SELF');

-- DropForeignKey
ALTER TABLE "CheckIn" DROP CONSTRAINT "CheckIn_circleId_fkey";

-- DropForeignKey
ALTER TABLE "CheckIn" DROP CONSTRAINT "CheckIn_userId_fkey";

-- DropForeignKey
ALTER TABLE "CircleReply" DROP CONSTRAINT "CircleReply_authorId_fkey";

-- DropForeignKey
ALTER TABLE "CircleReply" DROP CONSTRAINT "CircleReply_checkInId_fkey";

-- DropForeignKey
ALTER TABLE "OfficeHour" DROP CONSTRAINT "OfficeHour_bookedById_fkey";

-- DropForeignKey
ALTER TABLE "OfficeHour" DROP CONSTRAINT "OfficeHour_mentorId_fkey";

-- AlterTable
ALTER TABLE "Circle" ADD COLUMN     "field" TEXT,
ADD COLUMN     "stage" TEXT;

-- AlterTable
ALTER TABLE "CircleMember" ADD COLUMN     "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "buildField" TEXT,
ADD COLUMN     "buildStage" TEXT;

-- DropTable
DROP TABLE "CheckIn";

-- DropTable
DROP TABLE "CircleReply";

-- DropTable
DROP TABLE "OfficeHour";

-- CreateTable
CREATE TABLE "CircleMessage" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "authorId" TEXT,
    "text" TEXT NOT NULL,
    "weekOf" DATE,
    "fromJournal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CircleMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "JournalRole" NOT NULL,
    "text" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "spoken" BOOLEAN NOT NULL DEFAULT false,
    "demo" BOOLEAN NOT NULL DEFAULT false,
    "sharedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CircleMessage_circleId_createdAt_idx" ON "CircleMessage"("circleId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CircleMessage_circleId_weekOf_key" ON "CircleMessage"("circleId", "weekOf");

-- CreateIndex
CREATE INDEX "JournalMessage_userId_day_idx" ON "JournalMessage"("userId", "day");

-- AddForeignKey
ALTER TABLE "CircleMessage" ADD CONSTRAINT "CircleMessage_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleMessage" ADD CONSTRAINT "CircleMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalMessage" ADD CONSTRAINT "JournalMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

