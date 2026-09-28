-- Hub numbers count per owner: a person's first hub is 1, their second 2.

-- DropIndex
DROP INDEX "Hub_number_key";

-- AlterTable
ALTER TABLE "Hub" ALTER COLUMN "number" DROP DEFAULT;
DROP SEQUENCE "Hub_number_seq";

-- Renumber existing hubs per owner, oldest first.
UPDATE "Hub" AS h
SET "number" = r.n
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "ownerId" ORDER BY "createdAt", "id") AS n
  FROM "Hub"
) AS r
WHERE h."id" = r."id";

-- CreateIndex
CREATE UNIQUE INDEX "Hub_ownerId_number_key" ON "Hub"("ownerId", "number");
