-- AlterTable: add theme column to users
ALTER TABLE "users" ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'system';
ALTER TABLE "users" ADD CONSTRAINT "users_theme_check" CHECK ("theme" IN ('system', 'light', 'dark'));
