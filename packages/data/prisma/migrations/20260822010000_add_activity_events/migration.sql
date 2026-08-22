CREATE TABLE "tloz_activity_events" (
  "id" UUID NOT NULL,
  "contentId" TEXT NOT NULL,
  "actorId" UUID NOT NULL,
  "action" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "idempotencyKey" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tloz_activity_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tloz_activity_events_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "tloz_activity_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "tloz_activity_events_idempotencyKey_key" ON "tloz_activity_events"("idempotencyKey");
CREATE INDEX "tloz_activity_events_contentId_occurredAt_id_idx" ON "tloz_activity_events"("contentId", "occurredAt", "id");
