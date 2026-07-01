-- RedefineTable
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_tloz_missions" (
    "id" TEXT NOT NULL PRIMARY KEY,
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

INSERT INTO "new_tloz_missions" ("blockedReason", "completedAt", "conclusion", "createdAt", "description", "dueDate", "episodeId", "icon", "id", "ownerId", "progress", "projectId", "seasonId", "startDate", "status", "title", "type", "updatedAt")
SELECT "blockedReason", "completedAt", "conclusion", "createdAt", "description", "dueDate", "episodeId", "icon", "id", "ownerId", "progress", "projectId", "seasonId", "startDate", "status", "title", "type", "updatedAt" FROM "tloz_missions";

DROP TABLE "tloz_missions";
ALTER TABLE "new_tloz_missions" RENAME TO "tloz_missions";
CREATE INDEX "tloz_missions_ownerId_idx" ON "tloz_missions"("ownerId");
CREATE INDEX "tloz_missions_projectId_idx" ON "tloz_missions"("projectId");
CREATE INDEX "tloz_missions_seasonId_idx" ON "tloz_missions"("seasonId");
CREATE INDEX "tloz_missions_episodeId_idx" ON "tloz_missions"("episodeId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
