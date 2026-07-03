-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tloz_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "descriptionDetail" TEXT NOT NULL DEFAULT '',
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
INSERT INTO "new_tloz_projects" ("color", "createdAt", "description", "dueDate", "icon", "id", "name", "ownerId", "slug", "startDate", "status", "type", "updatedAt") SELECT "color", "createdAt", "description", "dueDate", "icon", "id", "name", "ownerId", "slug", "startDate", "status", "type", "updatedAt" FROM "tloz_projects";
DROP TABLE "tloz_projects";
ALTER TABLE "new_tloz_projects" RENAME TO "tloz_projects";
CREATE UNIQUE INDEX "tloz_projects_slug_key" ON "tloz_projects"("slug");
CREATE INDEX "tloz_projects_ownerId_idx" ON "tloz_projects"("ownerId");
CREATE TABLE "new_tloz_quest_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "descriptionDetail" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "ownerId" TEXT,
    "acquiredAt" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tloz_quest_items_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tloz_quest_items" ("acquiredAt", "category", "createdAt", "description", "icon", "id", "name", "ownerId", "status", "updatedAt") SELECT "acquiredAt", "category", "createdAt", "description", "icon", "id", "name", "ownerId", "status", "updatedAt" FROM "tloz_quest_items";
DROP TABLE "tloz_quest_items";
ALTER TABLE "new_tloz_quest_items" RENAME TO "tloz_quest_items";
CREATE INDEX "tloz_quest_items_ownerId_idx" ON "tloz_quest_items"("ownerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
