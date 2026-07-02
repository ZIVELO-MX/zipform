PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_tloz_projects" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'normal',
  "ownerId" TEXT NOT NULL,
  "startDate" TEXT NOT NULL,
  "dueDate" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "tloz_projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_tloz_projects" SELECT "id", CASE "id" WHEN 'project-core' THEN 'core' WHEN 'project-growth' THEN 'growth' WHEN 'project-ops' THEN 'operations' ELSE lower(replace("name", ' ', '-')) END, "name", "description", "color", "icon", "status", "type", "ownerId", "startDate", "dueDate", "createdAt", "updatedAt" FROM "tloz_projects";
DROP TABLE "tloz_projects";
ALTER TABLE "new_tloz_projects" RENAME TO "tloz_projects";
CREATE UNIQUE INDEX "tloz_projects_slug_key" ON "tloz_projects"("slug");
CREATE INDEX "tloz_projects_ownerId_idx" ON "tloz_projects"("ownerId");

CREATE TABLE "new_tloz_missions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "displayId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "conclusion" TEXT,
  "ownerId" TEXT NOT NULL,
  "projectId" TEXT,
  "seasonId" TEXT,
  "episodeId" TEXT,
  "dueDate" TEXT,
  "startDate" TEXT,
  "completedAt" DATETIME,
  "blockedReason" TEXT,
  "progress" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "tloz_missions_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "tloz_missions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "tloz_projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "tloz_missions_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "tloz_seasons" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "tloz_missions_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "tloz_episodes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tloz_missions"
SELECT m."id", printf('%s-%04d', upper(substr(p."name", 1, 3)), (SELECT count(*) FROM "tloz_missions" sibling WHERE sibling."projectId" = m."projectId" AND (sibling."createdAt" < m."createdAt" OR (sibling."createdAt" = m."createdAt" AND sibling."id" <= m."id")))), m."title", m."description", m."icon", m."type", m."status", m."conclusion", m."ownerId", m."projectId", m."seasonId", m."episodeId", m."dueDate", m."startDate", m."completedAt", m."blockedReason", m."progress", m."createdAt", m."updatedAt"
FROM "tloz_missions" m LEFT JOIN "tloz_projects" p ON p."id" = m."projectId";
DROP TABLE "tloz_missions";
ALTER TABLE "new_tloz_missions" RENAME TO "tloz_missions";
CREATE UNIQUE INDEX "tloz_missions_displayId_key" ON "tloz_missions"("displayId");
CREATE INDEX "tloz_missions_ownerId_idx" ON "tloz_missions"("ownerId");
CREATE INDEX "tloz_missions_projectId_idx" ON "tloz_missions"("projectId");
CREATE INDEX "tloz_missions_seasonId_idx" ON "tloz_missions"("seasonId");
CREATE INDEX "tloz_missions_episodeId_idx" ON "tloz_missions"("episodeId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
