PRAGMA foreign_keys=OFF;

ALTER TABLE "tloz_projects" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE "tloz_projects" ADD COLUMN "ownerId" TEXT NOT NULL DEFAULT 'benji' REFERENCES "users"("id");
ALTER TABLE "tloz_projects" ADD COLUMN "startDate" TEXT NOT NULL DEFAULT '2026-07-01';
ALTER TABLE "tloz_projects" ADD COLUMN "dueDate" TEXT;
CREATE INDEX "tloz_projects_ownerId_idx" ON "tloz_projects"("ownerId");

ALTER TABLE "tloz_quest_items" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'other';
ALTER TABLE "tloz_quest_items" ADD COLUMN "ownerId" TEXT REFERENCES "users"("id");
CREATE INDEX "tloz_quest_items_ownerId_idx" ON "tloz_quest_items"("ownerId");
UPDATE "tloz_quest_items" SET "status" = CASE WHEN "status" = 'completed' THEN 'unlocked' ELSE 'locked' END;

CREATE TABLE "new_tloz_resources" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "missionId" TEXT,
  "projectId" TEXT,
  "questItemId" TEXT,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT,
  "fileId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "tloz_resources_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "tloz_missions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "tloz_resources_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "tloz_projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "tloz_resources_questItemId_fkey" FOREIGN KEY ("questItemId") REFERENCES "tloz_quest_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "tloz_resources_single_owner" CHECK (("missionId" IS NOT NULL) + ("projectId" IS NOT NULL) + ("questItemId" IS NOT NULL) = 1)
);
INSERT INTO "new_tloz_resources" ("id", "missionId", "type", "title", "url", "fileId", "createdAt", "updatedAt") SELECT "id", "missionId", "type", "title", "url", "fileId", "createdAt", "updatedAt" FROM "tloz_resources";
DROP TABLE "tloz_resources";
ALTER TABLE "new_tloz_resources" RENAME TO "tloz_resources";
CREATE INDEX "tloz_resources_missionId_idx" ON "tloz_resources"("missionId");
CREATE INDEX "tloz_resources_projectId_idx" ON "tloz_resources"("projectId");
CREATE INDEX "tloz_resources_questItemId_idx" ON "tloz_resources"("questItemId");

PRAGMA foreign_keys=ON;
