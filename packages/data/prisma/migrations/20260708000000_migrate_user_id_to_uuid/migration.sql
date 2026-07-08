-- Drop FK constraints referencing users.id
ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_userId_fkey";
ALTER TABLE "api_keys" DROP CONSTRAINT IF EXISTS "api_keys_userId_fkey";
ALTER TABLE "api_keys" DROP CONSTRAINT IF EXISTS "api_keys_createdByUserId_fkey";
ALTER TABLE "tloz_missions" DROP CONSTRAINT IF EXISTS "tloz_missions_ownerId_fkey";
ALTER TABLE "tloz_projects" DROP CONSTRAINT IF EXISTS "tloz_projects_ownerId_fkey";
ALTER TABLE "tloz_quest_items" DROP CONSTRAINT IF EXISTS "tloz_quest_items_ownerId_fkey";
ALTER TABLE "tloz_user_mission_states" DROP CONSTRAINT IF EXISTS "tloz_user_mission_states_userId_fkey";

-- Change column types from text to uuid
ALTER TABLE "users" ALTER COLUMN "id" TYPE uuid USING "id"::uuid;
ALTER TABLE "sessions" ALTER COLUMN "userId" TYPE uuid USING "userId"::uuid;
ALTER TABLE "api_keys" ALTER COLUMN "userId" TYPE uuid USING "userId"::uuid;
ALTER TABLE "api_keys" ALTER COLUMN "createdByUserId" TYPE uuid USING "createdByUserId"::uuid;
ALTER TABLE "tloz_missions" ALTER COLUMN "ownerId" TYPE uuid USING "ownerId"::uuid;
ALTER TABLE "tloz_projects" ALTER COLUMN "ownerId" TYPE uuid USING "ownerId"::uuid;
ALTER TABLE "tloz_quest_items" ALTER COLUMN "ownerId" TYPE uuid USING "ownerId"::uuid;
ALTER TABLE "tloz_user_mission_states" ALTER COLUMN "userId" TYPE uuid USING "userId"::uuid;

-- Re-add FK constraints
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tloz_missions" ADD CONSTRAINT "tloz_missions_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tloz_projects" ADD CONSTRAINT "tloz_projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tloz_quest_items" ADD CONSTRAINT "tloz_quest_items_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tloz_user_mission_states" ADD CONSTRAINT "tloz_user_mission_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
