-- Cursor pagination orders legacy collections by createdAt and id. Keep the
-- sort columns in the same order as the repository queries so PostgreSQL can
-- continue from a cursor without sorting an unbounded result set.
CREATE INDEX "tloz_projects_createdAt_id_idx"
  ON "tloz_projects"("createdAt", "id");
CREATE INDEX "tloz_projects_ownerId_createdAt_id_idx"
  ON "tloz_projects"("ownerId", "createdAt", "id");
CREATE INDEX "tloz_projects_status_createdAt_id_idx"
  ON "tloz_projects"("status", "createdAt", "id");

CREATE INDEX "tloz_missions_createdAt_id_idx"
  ON "tloz_missions"("createdAt", "id");
CREATE INDEX "tloz_missions_projectId_createdAt_id_idx"
  ON "tloz_missions"("projectId", "createdAt", "id");
CREATE INDEX "tloz_missions_seasonId_createdAt_id_idx"
  ON "tloz_missions"("seasonId", "createdAt", "id");
CREATE INDEX "tloz_missions_episodeId_createdAt_id_idx"
  ON "tloz_missions"("episodeId", "createdAt", "id");
CREATE INDEX "tloz_missions_ownerId_createdAt_id_idx"
  ON "tloz_missions"("ownerId", "createdAt", "id");
CREATE INDEX "tloz_missions_status_createdAt_id_idx"
  ON "tloz_missions"("status", "createdAt", "id");

CREATE INDEX "tloz_quest_items_createdAt_id_idx"
  ON "tloz_quest_items"("createdAt", "id");
CREATE INDEX "tloz_quest_items_ownerId_createdAt_id_idx"
  ON "tloz_quest_items"("ownerId", "createdAt", "id");
CREATE INDEX "tloz_quest_items_status_createdAt_id_idx"
  ON "tloz_quest_items"("status", "createdAt", "id");
CREATE INDEX "tloz_quest_items_category_createdAt_id_idx"
  ON "tloz_quest_items"("category", "createdAt", "id");

CREATE INDEX "tloz_resources_createdAt_id_idx"
  ON "tloz_resources"("createdAt", "id");
CREATE INDEX "tloz_resources_missionId_createdAt_id_idx"
  ON "tloz_resources"("missionId", "createdAt", "id");
CREATE INDEX "tloz_resources_projectId_createdAt_id_idx"
  ON "tloz_resources"("projectId", "createdAt", "id");
CREATE INDEX "tloz_resources_questItemId_createdAt_id_idx"
  ON "tloz_resources"("questItemId", "createdAt", "id");
CREATE INDEX "tloz_resources_type_createdAt_id_idx"
  ON "tloz_resources"("type", "createdAt", "id");
