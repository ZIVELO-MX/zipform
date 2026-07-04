-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_metrics" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "platform_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tloz_seasons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tloz_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tloz_episodes" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "romanNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tloz_episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tloz_projects" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tloz_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tloz_missions" (
    "id" TEXT NOT NULL,
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
    "completedAt" TIMESTAMP(3),
    "blockedReason" TEXT,
    "progress" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tloz_missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tloz_mission_dependencies" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "dependsOnMissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tloz_mission_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tloz_quest_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "descriptionDetail" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "ownerId" TEXT,
    "acquiredAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tloz_quest_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tloz_mission_quest_items" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "questItemId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tloz_mission_quest_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tloz_checklist_items" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tloz_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tloz_resources" (
    "id" TEXT NOT NULL,
    "missionId" TEXT,
    "projectId" TEXT,
    "questItemId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "fileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tloz_resources_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tloz_resources_single_owner" CHECK (
        ("missionId" IS NOT NULL)::integer +
        ("projectId" IS NOT NULL)::integer +
        ("questItemId" IS NOT NULL)::integer = 1
    )
);

-- CreateTable
CREATE TABLE "tloz_user_mission_states" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tloz_user_mission_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "tloz_episodes_seasonId_idx" ON "tloz_episodes"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "tloz_projects_slug_key" ON "tloz_projects"("slug");

-- CreateIndex
CREATE INDEX "tloz_projects_ownerId_idx" ON "tloz_projects"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "tloz_missions_displayId_key" ON "tloz_missions"("displayId");

-- CreateIndex
CREATE INDEX "tloz_missions_ownerId_idx" ON "tloz_missions"("ownerId");

-- CreateIndex
CREATE INDEX "tloz_missions_projectId_idx" ON "tloz_missions"("projectId");

-- CreateIndex
CREATE INDEX "tloz_missions_seasonId_idx" ON "tloz_missions"("seasonId");

-- CreateIndex
CREATE INDEX "tloz_missions_episodeId_idx" ON "tloz_missions"("episodeId");

-- CreateIndex
CREATE INDEX "tloz_mission_dependencies_dependsOnMissionId_idx" ON "tloz_mission_dependencies"("dependsOnMissionId");

-- CreateIndex
CREATE UNIQUE INDEX "tloz_mission_dependencies_missionId_dependsOnMissionId_key" ON "tloz_mission_dependencies"("missionId", "dependsOnMissionId");

-- CreateIndex
CREATE INDEX "tloz_mission_quest_items_questItemId_idx" ON "tloz_mission_quest_items"("questItemId");

-- CreateIndex
CREATE UNIQUE INDEX "tloz_mission_quest_items_missionId_questItemId_key" ON "tloz_mission_quest_items"("missionId", "questItemId");

-- CreateIndex
CREATE INDEX "tloz_checklist_items_missionId_idx" ON "tloz_checklist_items"("missionId");

-- CreateIndex
CREATE INDEX "tloz_resources_missionId_idx" ON "tloz_resources"("missionId");

-- CreateIndex
CREATE INDEX "tloz_resources_projectId_idx" ON "tloz_resources"("projectId");

-- CreateIndex
CREATE INDEX "tloz_resources_questItemId_idx" ON "tloz_resources"("questItemId");

-- CreateIndex
CREATE INDEX "tloz_user_mission_states_missionId_idx" ON "tloz_user_mission_states"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "tloz_user_mission_states_userId_slot_key" ON "tloz_user_mission_states"("userId", "slot");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tloz_episodes" ADD CONSTRAINT "tloz_episodes_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "tloz_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tloz_projects" ADD CONSTRAINT "tloz_projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tloz_missions" ADD CONSTRAINT "tloz_missions_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tloz_missions" ADD CONSTRAINT "tloz_missions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "tloz_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tloz_missions" ADD CONSTRAINT "tloz_missions_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "tloz_seasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tloz_missions" ADD CONSTRAINT "tloz_missions_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "tloz_episodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tloz_mission_dependencies" ADD CONSTRAINT "tloz_mission_dependencies_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "tloz_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tloz_mission_dependencies" ADD CONSTRAINT "tloz_mission_dependencies_dependsOnMissionId_fkey" FOREIGN KEY ("dependsOnMissionId") REFERENCES "tloz_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tloz_mission_quest_items" ADD CONSTRAINT "tloz_mission_quest_items_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "tloz_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tloz_mission_quest_items" ADD CONSTRAINT "tloz_mission_quest_items_questItemId_fkey" FOREIGN KEY ("questItemId") REFERENCES "tloz_quest_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tloz_checklist_items" ADD CONSTRAINT "tloz_checklist_items_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "tloz_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tloz_resources" ADD CONSTRAINT "tloz_resources_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "tloz_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tloz_resources" ADD CONSTRAINT "tloz_resources_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "tloz_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tloz_resources" ADD CONSTRAINT "tloz_resources_questItemId_fkey" FOREIGN KEY ("questItemId") REFERENCES "tloz_quest_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tloz_user_mission_states" ADD CONSTRAINT "tloz_user_mission_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tloz_user_mission_states" ADD CONSTRAINT "tloz_user_mission_states_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "tloz_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
