CREATE TABLE "containers" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "slug" TEXT,
    "presentation" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "definition" JSONB NOT NULL DEFAULT '{}',
    "data" JSONB NOT NULL DEFAULT '{}',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "containers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "containers_public_id_not_empty" CHECK (length(btrim("publicId")) > 0),
    CONSTRAINT "containers_presentation_not_empty" CHECK (length(btrim("presentation")) > 0),
    CONSTRAINT "containers_title_not_empty" CHECK (length(btrim("title")) > 0),
    CONSTRAINT "containers_revision_positive" CHECK ("revision" > 0),
    CONSTRAINT "containers_definition_object" CHECK (jsonb_typeof("definition") = 'object'),
    CONSTRAINT "containers_data_object" CHECK (jsonb_typeof("data") = 'object')
);

CREATE TABLE "contents" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "presentation" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "data" JSONB NOT NULL DEFAULT '{}',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "contents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "contents_public_id_not_empty" CHECK (length(btrim("publicId")) > 0),
    CONSTRAINT "contents_presentation_not_empty" CHECK (length(btrim("presentation")) > 0),
    CONSTRAINT "contents_title_not_empty" CHECK (length(btrim("title")) > 0),
    CONSTRAINT "contents_revision_positive" CHECK ("revision" > 0),
    CONSTRAINT "contents_data_object" CHECK (jsonb_typeof("data") = 'object')
);

CREATE UNIQUE INDEX "containers_publicId_key" ON "containers"("publicId");
CREATE UNIQUE INDEX "containers_slug_key" ON "containers"("slug");
CREATE INDEX "containers_presentation_updatedAt_id_idx" ON "containers"("presentation", "updatedAt", "id");
CREATE UNIQUE INDEX "contents_publicId_key" ON "contents"("publicId");
CREATE INDEX "contents_containerId_presentation_updatedAt_id_idx" ON "contents"("containerId", "presentation", "updatedAt", "id");
CREATE INDEX "contents_data_gin_idx" ON "contents" USING GIN ("data" jsonb_path_ops);

ALTER TABLE "contents"
ADD CONSTRAINT "contents_containerId_fkey"
FOREIGN KEY ("containerId") REFERENCES "containers"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
