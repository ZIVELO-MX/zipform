-- Create avatars table
CREATE TABLE "avatars" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL DEFAULT ''
);

-- Add UNIQUE constraint on users.username
ALTER TABLE "users" ADD CONSTRAINT "users_username_key" UNIQUE ("username");
