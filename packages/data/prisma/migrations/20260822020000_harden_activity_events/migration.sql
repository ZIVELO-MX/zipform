ALTER TABLE "tloz_activity_events"
  DROP CONSTRAINT "tloz_activity_events_contentId_fkey";

ALTER TABLE "tloz_activity_events"
  ALTER COLUMN "contentId" DROP NOT NULL,
  ADD COLUMN "entityType" TEXT,
  ADD COLUMN "entityId" TEXT,
  ADD COLUMN "entityPublicId" TEXT,
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'system';

UPDATE "tloz_activity_events" AS event
SET
  "entityType" = content."presentation",
  "entityId" = event."contentId",
  "entityPublicId" = content."publicId"
FROM "contents" AS content
WHERE content."id" = event."contentId";

UPDATE "tloz_activity_events"
SET
  "entityType" = COALESCE("entityType", 'content'),
  "entityId" = COALESCE("entityId", "contentId", "id"::text),
  "entityPublicId" = COALESCE("entityPublicId", "contentId", "id"::text);

ALTER TABLE "tloz_activity_events"
  ALTER COLUMN "entityType" SET NOT NULL,
  ALTER COLUMN "entityId" SET NOT NULL,
  ALTER COLUMN "entityPublicId" SET NOT NULL;

DROP INDEX "tloz_activity_events_contentId_occurredAt_id_idx";
CREATE INDEX "tloz_activity_events_entityType_entityId_occurredAt_id_idx"
  ON "tloz_activity_events"("entityType", "entityId", "occurredAt", "id");
CREATE INDEX "tloz_activity_events_entityPublicId_occurredAt_id_idx"
  ON "tloz_activity_events"("entityPublicId", "occurredAt", "id");
CREATE INDEX "tloz_activity_events_contentId_idx"
  ON "tloz_activity_events"("contentId");

ALTER TABLE "tloz_activity_events"
  ADD CONSTRAINT "tloz_activity_events_contentId_fkey"
  FOREIGN KEY ("contentId") REFERENCES "contents"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
