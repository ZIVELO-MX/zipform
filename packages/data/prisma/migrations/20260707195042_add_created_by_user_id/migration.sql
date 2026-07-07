/*
  Warnings:

  - Added the required column `createdByUserId` to the `api_keys` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "createdByUserId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "api_keys_createdByUserId_idx" ON "api_keys"("createdByUserId");

-- CreateIndex
CREATE INDEX "tloz_quest_items_ownerId_idx" ON "tloz_quest_items"("ownerId");

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tloz_quest_items" ADD CONSTRAINT "tloz_quest_items_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
