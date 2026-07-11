-- Create avatars table
CREATE TABLE "avatars" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL DEFAULT ''
);

-- Seed default avatars
INSERT INTO "avatars" (id, name, "imageUrl") VALUES
  ('5372f758-a74b-4cad-b9b3-80e65760cdd1', 'Semielfo', 'https://pujkknhxrqmeckyiqxte.supabase.co/storage/v1/object/public/PFP/Semielfo.jpeg'),
  ('43dadd54-2dab-421d-9178-b7c12d03d0a9', 'Dragon', 'https://pujkknhxrqmeckyiqxte.supabase.co/storage/v1/object/public/PFP/Dragon.jpeg'),
  ('275f8102-716f-4e65-84b8-0995d2a1e69f', 'ZIBOT', 'https://pujkknhxrqmeckyiqxte.supabase.co/storage/v1/object/public/PFP/Zibot.jpeg');

-- Add UNIQUE constraint on users.username
ALTER TABLE "users" ADD CONSTRAINT "users_username_key" UNIQUE ("username");
