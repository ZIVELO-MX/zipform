ALTER TABLE "tloz_resources"
  ADD COLUMN "groupKey" TEXT,
  ADD COLUMN "externalKey" TEXT,
  ADD COLUMN "storagePath" TEXT,
  ADD COLUMN "contentType" TEXT,
  ADD COLUMN "sizeBytes" INTEGER,
  ADD COLUMN "width" INTEGER,
  ADD COLUMN "height" INTEGER,
  ADD COLUMN "sourceRevision" TEXT;

CREATE UNIQUE INDEX "tloz_resources_missionId_groupKey_externalKey_key"
  ON "tloz_resources"("missionId", "groupKey", "externalKey");

CREATE TABLE "tloz_attachment_batches" (
  "id" TEXT NOT NULL,
  "missionId" TEXT NOT NULL,
  "groupKey" TEXT NOT NULL,
  "sourceRevision" TEXT NOT NULL,
  "generation" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "manifest" JSONB NOT NULL,
  "finalizedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tloz_attachment_batches_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tloz_attachment_batches_missionId_fkey"
    FOREIGN KEY ("missionId") REFERENCES "tloz_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "tloz_attachment_batches_missionId_groupKey_sourceRevision_key"
  ON "tloz_attachment_batches"("missionId", "groupKey", "sourceRevision");

CREATE UNIQUE INDEX "tloz_attachment_batches_missionId_groupKey_generation_key"
  ON "tloz_attachment_batches"("missionId", "groupKey", "generation");

CREATE INDEX "tloz_attachment_batches_missionId_groupKey_generation_idx"
  ON "tloz_attachment_batches"("missionId", "groupKey", "generation");
