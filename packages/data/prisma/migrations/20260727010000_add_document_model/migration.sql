CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "tloz_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "publicId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "projectId" UUID,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tloz_documents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tloz_documents_kind_check" CHECK ("kind" IN ('project', 'mission', 'inventory'))
);

CREATE TABLE "tloz_project_documents" (
    "documentId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" UUID,
    "color" TEXT NOT NULL DEFAULT '#6B6B6B',
    "icon" TEXT NOT NULL DEFAULT 'FolderKanban',
    "status" TEXT NOT NULL DEFAULT 'active',
    "projectType" TEXT NOT NULL DEFAULT 'normal',
    "startDate" TEXT,
    "dueDate" TEXT,
    CONSTRAINT "tloz_project_documents_pkey" PRIMARY KEY ("documentId")
);

CREATE TABLE "tloz_mission_documents" (
    "documentId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Sword',
    "startDate" TEXT,
    "dueDate" TEXT,
    "completedAt" TIMESTAMP(3),
    "blockedReason" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "tloz_mission_documents_pkey" PRIMARY KEY ("documentId")
);

CREATE TABLE "tloz_inventory_documents" (
    "documentId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "ownerId" UUID,
    "category" TEXT NOT NULL DEFAULT 'other',
    "status" TEXT NOT NULL DEFAULT 'locked',
    "icon" TEXT NOT NULL DEFAULT 'PackageOpen',
    "acquiredAt" TEXT,
    CONSTRAINT "tloz_inventory_documents_pkey" PRIMARY KEY ("documentId")
);

CREATE TABLE "tloz_field_definitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL,
    "defaultValue" JSONB,
    "options" JSONB,
    "retiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tloz_field_definitions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tloz_field_definitions_type_check" CHECK (
        "fieldType" IN ('text', 'number', 'boolean', 'date', 'select', 'multiselect', 'person', 'relation')
    )
);

CREATE TABLE "tloz_field_values" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "documentId" UUID NOT NULL,
    "fieldDefinitionId" UUID NOT NULL,
    "stringValue" TEXT,
    "numberValue" DECIMAL(65,30),
    "booleanValue" BOOLEAN,
    "dateValue" TIMESTAMP(3),
    "stringListValue" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "personId" UUID,
    "relatedDocumentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tloz_field_values_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tloz_status_options" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "color" TEXT,
    "position" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "tloz_status_options_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tloz_status_options_role_check" CHECK (
        "role" IN ('backlog', 'ready', 'active', 'blocked', 'done')
    )
);

CREATE TABLE "tloz_document_relations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sourceDocumentId" UUID NOT NULL,
    "targetDocumentId" UUID NOT NULL,
    "relationType" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tloz_document_relations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tloz_document_relations_distinct_check" CHECK ("sourceDocumentId" <> "targetDocumentId")
);

CREATE UNIQUE INDEX "tloz_documents_publicId_key" ON "tloz_documents"("publicId");
CREATE UNIQUE INDEX "tloz_documents_sourceType_sourceId_key" ON "tloz_documents"("sourceType", "sourceId");
CREATE INDEX "tloz_documents_kind_projectId_idx" ON "tloz_documents"("kind", "projectId");
CREATE INDEX "tloz_documents_updatedAt_idx" ON "tloz_documents"("updatedAt");
CREATE UNIQUE INDEX "tloz_project_documents_slug_key" ON "tloz_project_documents"("slug");
CREATE INDEX "tloz_project_documents_ownerId_idx" ON "tloz_project_documents"("ownerId");
CREATE INDEX "tloz_mission_documents_projectId_status_idx" ON "tloz_mission_documents"("projectId", "status");
CREATE INDEX "tloz_mission_documents_ownerId_idx" ON "tloz_mission_documents"("ownerId");
CREATE INDEX "tloz_inventory_documents_projectId_status_idx" ON "tloz_inventory_documents"("projectId", "status");
CREATE INDEX "tloz_inventory_documents_ownerId_idx" ON "tloz_inventory_documents"("ownerId");
CREATE UNIQUE INDEX "tloz_field_definitions_projectId_key_key" ON "tloz_field_definitions"("projectId", "key");
CREATE INDEX "tloz_field_definitions_projectId_position_idx" ON "tloz_field_definitions"("projectId", "position");
CREATE UNIQUE INDEX "tloz_field_values_documentId_fieldDefinitionId_key" ON "tloz_field_values"("documentId", "fieldDefinitionId");
CREATE INDEX "tloz_field_values_fieldDefinitionId_stringValue_idx" ON "tloz_field_values"("fieldDefinitionId", "stringValue");
CREATE INDEX "tloz_field_values_fieldDefinitionId_numberValue_idx" ON "tloz_field_values"("fieldDefinitionId", "numberValue");
CREATE INDEX "tloz_field_values_fieldDefinitionId_booleanValue_idx" ON "tloz_field_values"("fieldDefinitionId", "booleanValue");
CREATE INDEX "tloz_field_values_fieldDefinitionId_dateValue_idx" ON "tloz_field_values"("fieldDefinitionId", "dateValue");
CREATE INDEX "tloz_field_values_personId_idx" ON "tloz_field_values"("personId");
CREATE INDEX "tloz_field_values_relatedDocumentId_idx" ON "tloz_field_values"("relatedDocumentId");
CREATE UNIQUE INDEX "tloz_status_options_projectId_key_key" ON "tloz_status_options"("projectId", "key");
CREATE INDEX "tloz_status_options_projectId_role_idx" ON "tloz_status_options"("projectId", "role");
CREATE UNIQUE INDEX "tloz_document_relations_source_target_type_key" ON "tloz_document_relations"("sourceDocumentId", "targetDocumentId", "relationType");
CREATE INDEX "tloz_document_relations_target_type_idx" ON "tloz_document_relations"("targetDocumentId", "relationType");

ALTER TABLE "tloz_documents"
    ADD CONSTRAINT "tloz_documents_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "tloz_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tloz_project_documents"
    ADD CONSTRAINT "tloz_project_documents_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "tloz_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tloz_mission_documents"
    ADD CONSTRAINT "tloz_mission_documents_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "tloz_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tloz_mission_documents"
    ADD CONSTRAINT "tloz_mission_documents_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "tloz_project_documents"("documentId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tloz_inventory_documents"
    ADD CONSTRAINT "tloz_inventory_documents_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "tloz_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tloz_inventory_documents"
    ADD CONSTRAINT "tloz_inventory_documents_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "tloz_project_documents"("documentId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tloz_field_definitions"
    ADD CONSTRAINT "tloz_field_definitions_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "tloz_project_documents"("documentId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tloz_field_values"
    ADD CONSTRAINT "tloz_field_values_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "tloz_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tloz_field_values"
    ADD CONSTRAINT "tloz_field_values_fieldDefinitionId_fkey"
    FOREIGN KEY ("fieldDefinitionId") REFERENCES "tloz_field_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tloz_field_values"
    ADD CONSTRAINT "tloz_field_values_relatedDocumentId_fkey"
    FOREIGN KEY ("relatedDocumentId") REFERENCES "tloz_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tloz_status_options"
    ADD CONSTRAINT "tloz_status_options_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "tloz_project_documents"("documentId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tloz_document_relations"
    ADD CONSTRAINT "tloz_document_relations_sourceDocumentId_fkey"
    FOREIGN KEY ("sourceDocumentId") REFERENCES "tloz_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tloz_document_relations"
    ADD CONSTRAINT "tloz_document_relations_targetDocumentId_fkey"
    FOREIGN KEY ("targetDocumentId") REFERENCES "tloz_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- System containers exist as ordinary Project documents. They have no legacy
-- row because the v1 schema represented Inventory as a global collection.
INSERT INTO "tloz_documents" (
    "publicId", "kind", "title", "summary", "body", "sourceType", "sourceId"
) VALUES
    ('project-inventory', 'project', 'Inventory', 'Catálogo documental de recursos.', '', NULL, NULL),
    ('project-unassigned', 'project', 'Sin proyecto', 'Contenedor de compatibilidad para datos heredados.', '', NULL, NULL);

INSERT INTO "tloz_project_documents" (
    "documentId", "slug", "color", "icon", "status", "projectType"
)
SELECT "id", 'inventory', '#7A5A12', 'PackageOpen', 'active', 'system'
FROM "tloz_documents" WHERE "publicId" = 'project-inventory';

INSERT INTO "tloz_project_documents" (
    "documentId", "slug", "color", "icon", "status", "projectType"
)
SELECT "id", 'unassigned', '#6B6B6B', 'FolderKanban', 'archived', 'system'
FROM "tloz_documents" WHERE "publicId" = 'project-unassigned';

INSERT INTO "tloz_documents" (
    "id", "publicId", "kind", "title", "summary", "body",
    "sourceType", "sourceId", "createdAt", "updatedAt"
)
SELECT
    gen_random_uuid(),
    'project-' || p."slug",
    'project',
    p."name",
    p."description",
    p."descriptionDetail",
    'project',
    p."id"::text,
    p."createdAt",
    p."updatedAt"
FROM "tloz_projects" p
ON CONFLICT ("sourceType", "sourceId") DO NOTHING;

INSERT INTO "tloz_project_documents" (
    "documentId", "slug", "ownerId", "color", "icon", "status",
    "projectType", "startDate", "dueDate"
)
SELECT
    d."id", p."slug", p."ownerId", p."color", p."icon", p."status",
    p."type", p."startDate", p."dueDate"
FROM "tloz_documents" d
JOIN "tloz_projects" p ON d."sourceType" = 'project' AND d."sourceId" = p."id"::text
ON CONFLICT ("documentId") DO NOTHING;

-- Default contracts preserve current fields while allowing each Project to
-- reorder, hide, require, replace or retire them independently.
INSERT INTO "tloz_field_definitions" (
    "projectId", "key", "label", "fieldType", "required", "visible",
    "position", "defaultValue", "options"
)
SELECT
    p."documentId",
    defaults."key",
    defaults."label",
    'select',
    true,
    true,
    defaults."position",
    to_jsonb(defaults."defaultValue"::text),
    defaults."options"::jsonb
FROM "tloz_project_documents" p
CROSS JOIN (
    VALUES
        (
            'status',
            'Estado',
            0,
            'later',
            '[{"value":"later","label":"Later","role":"backlog"},{"value":"next","label":"Next","role":"ready"},{"value":"now","label":"Now","role":"active"},{"value":"blocked","label":"Blocked","role":"blocked"},{"value":"completed","label":"Completed","role":"done"}]'
        ),
        (
            'category',
            'Categoría',
            1,
            'side_quest',
            '[{"value":"main_quest","label":"Main Quest"},{"value":"side_quest","label":"Side Quest"},{"value":"farming_quest","label":"Farming Quest"},{"value":"exploration_quest","label":"Exploration Quest"}]'
        )
) AS defaults("key", "label", "position", "defaultValue", "options")
WHERE p."slug" NOT IN ('inventory')
ON CONFLICT ("projectId", "key") DO NOTHING;

INSERT INTO "tloz_field_definitions" (
    "projectId", "key", "label", "fieldType", "required", "visible",
    "position", "defaultValue", "options"
)
SELECT
    p."documentId",
    defaults."key",
    defaults."label",
    'select',
    true,
    true,
    defaults."position",
    to_jsonb(defaults."defaultValue"::text),
    defaults."options"::jsonb
FROM "tloz_project_documents" p
CROSS JOIN (
    VALUES
        (
            'status',
            'Estado',
            0,
            'locked',
            '[{"value":"locked","label":"Bloqueado","role":"backlog"},{"value":"unlocked","label":"Desbloqueado","role":"done"}]'
        ),
        (
            'category',
            'Categoría',
            1,
            'other',
            '[{"value":"tool","label":"Herramienta"},{"value":"access","label":"Acceso"},{"value":"asset","label":"Activo"},{"value":"document","label":"Documento"},{"value":"other","label":"Otro"}]'
        )
) AS defaults("key", "label", "position", "defaultValue", "options")
WHERE p."slug" = 'inventory'
ON CONFLICT ("projectId", "key") DO NOTHING;

INSERT INTO "tloz_status_options" (
    "projectId", "key", "label", "role", "color", "position"
)
SELECT p."documentId", status."key", status."label", status."role", status."color", status."position"
FROM "tloz_project_documents" p
CROSS JOIN (
    VALUES
        ('later', 'Later', 'backlog', '#6B6B6B', 0),
        ('next', 'Next', 'ready', '#3A47B5', 1),
        ('now', 'Now', 'active', '#1E8E5A', 2),
        ('blocked', 'Blocked', 'blocked', '#B91C22', 3),
        ('completed', 'Completed', 'done', '#1E6B3C', 4)
) AS status("key", "label", "role", "color", "position")
WHERE p."slug" <> 'inventory'
ON CONFLICT ("projectId", "key") DO NOTHING;

INSERT INTO "tloz_status_options" (
    "projectId", "key", "label", "role", "color", "position"
)
SELECT p."documentId", status."key", status."label", status."role", status."color", status."position"
FROM "tloz_project_documents" p
CROSS JOIN (
    VALUES
        ('locked', 'Bloqueado', 'backlog', '#7A5A12', 0),
        ('unlocked', 'Desbloqueado', 'done', '#1E6B3C', 1)
) AS status("key", "label", "role", "color", "position")
WHERE p."slug" = 'inventory'
ON CONFLICT ("projectId", "key") DO NOTHING;

INSERT INTO "tloz_documents" (
    "id", "publicId", "kind", "projectId", "title", "summary", "body",
    "sourceType", "sourceId", "createdAt", "updatedAt"
)
SELECT
    gen_random_uuid(),
    m."displayId",
    'mission',
    COALESCE(project_document."id", unassigned."id"),
    m."title",
    m."description",
    m."descriptionDetail",
    'mission',
    m."id"::text,
    m."createdAt",
    m."updatedAt"
FROM "tloz_missions" m
LEFT JOIN "tloz_documents" project_document
    ON project_document."sourceType" = 'project'
    AND project_document."sourceId" = m."projectId"::text
CROSS JOIN (
    SELECT "id" FROM "tloz_documents" WHERE "publicId" = 'project-unassigned'
) unassigned
ON CONFLICT ("sourceType", "sourceId") DO NOTHING;

INSERT INTO "tloz_mission_documents" (
    "documentId", "projectId", "ownerId", "category", "status", "icon",
    "startDate", "dueDate", "completedAt", "blockedReason", "progress"
)
SELECT
    d."id", d."projectId", m."ownerId", m."type", m."status", m."icon",
    m."startDate", m."dueDate", m."completedAt", m."blockedReason", m."progress"
FROM "tloz_documents" d
JOIN "tloz_missions" m ON d."sourceType" = 'mission' AND d."sourceId" = m."id"::text
ON CONFLICT ("documentId") DO NOTHING;

INSERT INTO "tloz_documents" (
    "id", "publicId", "kind", "projectId", "title", "summary", "body",
    "sourceType", "sourceId", "createdAt", "updatedAt"
)
SELECT
    gen_random_uuid(),
    'INV-' || lpad(row_number() OVER (ORDER BY i."createdAt", i."id")::text, 4, '0'),
    'inventory',
    inventory_project."id",
    i."name",
    i."description",
    i."descriptionDetail",
    'inventory',
    i."id"::text,
    i."createdAt",
    i."updatedAt"
FROM "tloz_quest_items" i
CROSS JOIN (
    SELECT "id" FROM "tloz_documents" WHERE "publicId" = 'project-inventory'
) inventory_project
ON CONFLICT ("sourceType", "sourceId") DO NOTHING;

INSERT INTO "tloz_inventory_documents" (
    "documentId", "projectId", "ownerId", "category", "status", "icon", "acquiredAt"
)
SELECT
    d."id", d."projectId", i."ownerId", i."category", i."status", i."icon", i."acquiredAt"
FROM "tloz_documents" d
JOIN "tloz_quest_items" i ON d."sourceType" = 'inventory' AND d."sourceId" = i."id"::text
ON CONFLICT ("documentId") DO NOTHING;

INSERT INTO "tloz_field_values" (
    "documentId", "fieldDefinitionId", "stringValue"
)
SELECT d."id", f."id", CASE f."key" WHEN 'status' THEN m."status" ELSE m."type" END
FROM "tloz_documents" d
JOIN "tloz_missions" m ON d."sourceType" = 'mission' AND d."sourceId" = m."id"::text
JOIN "tloz_field_definitions" f ON f."projectId" = d."projectId" AND f."key" IN ('status', 'category')
ON CONFLICT ("documentId", "fieldDefinitionId") DO NOTHING;

INSERT INTO "tloz_field_values" (
    "documentId", "fieldDefinitionId", "stringValue"
)
SELECT d."id", f."id", CASE f."key" WHEN 'status' THEN i."status" ELSE i."category" END
FROM "tloz_documents" d
JOIN "tloz_quest_items" i ON d."sourceType" = 'inventory' AND d."sourceId" = i."id"::text
JOIN "tloz_field_definitions" f ON f."projectId" = d."projectId" AND f."key" IN ('status', 'category')
ON CONFLICT ("documentId", "fieldDefinitionId") DO NOTHING;

INSERT INTO "tloz_document_relations" (
    "sourceDocumentId", "targetDocumentId", "relationType"
)
SELECT source."id", target."id", 'depends_on'
FROM "tloz_mission_dependencies" dependency
JOIN "tloz_documents" source
    ON source."sourceType" = 'mission' AND source."sourceId" = dependency."missionId"::text
JOIN "tloz_documents" target
    ON target."sourceType" = 'mission' AND target."sourceId" = dependency."dependsOnMissionId"::text
ON CONFLICT ("sourceDocumentId", "targetDocumentId", "relationType") DO NOTHING;

INSERT INTO "tloz_document_relations" (
    "sourceDocumentId", "targetDocumentId", "relationType", "required"
)
SELECT mission."id", inventory."id", 'uses_inventory', link."required"
FROM "tloz_mission_quest_items" link
JOIN "tloz_documents" mission
    ON mission."sourceType" = 'mission' AND mission."sourceId" = link."missionId"::text
JOIN "tloz_documents" inventory
    ON inventory."sourceType" = 'inventory' AND inventory."sourceId" = link."questItemId"::text
ON CONFLICT ("sourceDocumentId", "targetDocumentId", "relationType") DO NOTHING;

ALTER TABLE "tloz_resources" ADD COLUMN "documentId" UUID;
CREATE INDEX "tloz_resources_documentId_idx" ON "tloz_resources"("documentId");
ALTER TABLE "tloz_resources"
    ADD CONSTRAINT "tloz_resources_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "tloz_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "tloz_resources" resource
SET "documentId" = document."id"
FROM "tloz_documents" document
WHERE
    (resource."missionId" IS NOT NULL AND document."sourceType" = 'mission' AND document."sourceId" = resource."missionId"::text)
    OR (resource."projectId" IS NOT NULL AND document."sourceType" = 'project' AND document."sourceId" = resource."projectId"::text)
    OR (resource."questItemId" IS NOT NULL AND document."sourceType" = 'inventory' AND document."sourceId" = resource."questItemId"::text);

ALTER TABLE "tloz_resources" DROP CONSTRAINT IF EXISTS "tloz_resources_single_owner";
ALTER TABLE "tloz_resources" ADD CONSTRAINT "tloz_resources_document_owner" CHECK (
    "documentId" IS NOT NULL
    OR (
        ("missionId" IS NOT NULL)::integer +
        ("projectId" IS NOT NULL)::integer +
        ("questItemId" IS NOT NULL)::integer = 1
    )
);

CREATE OR REPLACE FUNCTION tloz_seed_project_contract(project_document_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO "tloz_field_definitions" (
        "projectId", "key", "label", "fieldType", "required", "visible",
        "position", "defaultValue", "options"
    ) VALUES
        (
            project_document_id, 'status', 'Estado', 'select', true, true, 0,
            to_jsonb('later'::text),
            '[{"value":"later","label":"Later","role":"backlog"},{"value":"next","label":"Next","role":"ready"},{"value":"now","label":"Now","role":"active"},{"value":"blocked","label":"Blocked","role":"blocked"},{"value":"completed","label":"Completed","role":"done"}]'::jsonb
        ),
        (
            project_document_id, 'category', 'Categoría', 'select', true, true, 1,
            to_jsonb('side_quest'::text),
            '[{"value":"main_quest","label":"Main Quest"},{"value":"side_quest","label":"Side Quest"},{"value":"farming_quest","label":"Farming Quest"},{"value":"exploration_quest","label":"Exploration Quest"}]'::jsonb
        )
    ON CONFLICT ("projectId", "key") DO NOTHING;

    INSERT INTO "tloz_status_options" (
        "projectId", "key", "label", "role", "color", "position"
    ) VALUES
        (project_document_id, 'later', 'Later', 'backlog', '#6B6B6B', 0),
        (project_document_id, 'next', 'Next', 'ready', '#3A47B5', 1),
        (project_document_id, 'now', 'Now', 'active', '#1E8E5A', 2),
        (project_document_id, 'blocked', 'Blocked', 'blocked', '#B91C22', 3),
        (project_document_id, 'completed', 'Completed', 'done', '#1E6B3C', 4)
    ON CONFLICT ("projectId", "key") DO NOTHING;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tloz_sync_project_document()
RETURNS TRIGGER AS $$
DECLARE
    document_id UUID;
BEGIN
    IF current_setting('tloz.sync_origin', true) = 'document' THEN
        RETURN NEW;
    END IF;

    INSERT INTO "tloz_documents" (
        "publicId", "kind", "title", "summary", "body", "sourceType",
        "sourceId", "createdAt", "updatedAt"
    ) VALUES (
        'project-' || NEW."slug", 'project', NEW."name", NEW."description",
        NEW."descriptionDetail", 'project', NEW."id"::text, NEW."createdAt", NEW."updatedAt"
    )
    ON CONFLICT ("sourceType", "sourceId") DO UPDATE SET
        "publicId" = EXCLUDED."publicId",
        "title" = EXCLUDED."title",
        "summary" = EXCLUDED."summary",
        "body" = EXCLUDED."body",
        "revision" = "tloz_documents"."revision" + 1,
        "updatedAt" = EXCLUDED."updatedAt"
    RETURNING "id" INTO document_id;

    INSERT INTO "tloz_project_documents" (
        "documentId", "slug", "ownerId", "color", "icon", "status",
        "projectType", "startDate", "dueDate"
    ) VALUES (
        document_id, NEW."slug", NEW."ownerId", NEW."color", NEW."icon",
        NEW."status", NEW."type", NEW."startDate", NEW."dueDate"
    )
    ON CONFLICT ("documentId") DO UPDATE SET
        "slug" = EXCLUDED."slug",
        "ownerId" = EXCLUDED."ownerId",
        "color" = EXCLUDED."color",
        "icon" = EXCLUDED."icon",
        "status" = EXCLUDED."status",
        "projectType" = EXCLUDED."projectType",
        "startDate" = EXCLUDED."startDate",
        "dueDate" = EXCLUDED."dueDate";

    PERFORM tloz_seed_project_contract(document_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tloz_sync_mission_document()
RETURNS TRIGGER AS $$
DECLARE
    document_id UUID;
    project_document_id UUID;
BEGIN
    IF current_setting('tloz.sync_origin', true) = 'document' THEN
        RETURN NEW;
    END IF;

    SELECT "id" INTO project_document_id
    FROM "tloz_documents"
    WHERE "sourceType" = 'project' AND "sourceId" = NEW."projectId"::text;
    IF project_document_id IS NULL THEN
        SELECT "id" INTO project_document_id
        FROM "tloz_documents" WHERE "publicId" = 'project-unassigned';
    END IF;

    INSERT INTO "tloz_documents" (
        "publicId", "kind", "projectId", "title", "summary", "body",
        "sourceType", "sourceId", "createdAt", "updatedAt"
    ) VALUES (
        NEW."displayId", 'mission', project_document_id, NEW."title",
        NEW."description", NEW."descriptionDetail", 'mission', NEW."id"::text,
        NEW."createdAt", NEW."updatedAt"
    )
    ON CONFLICT ("sourceType", "sourceId") DO UPDATE SET
        "publicId" = EXCLUDED."publicId",
        "projectId" = EXCLUDED."projectId",
        "title" = EXCLUDED."title",
        "summary" = EXCLUDED."summary",
        "body" = EXCLUDED."body",
        "revision" = "tloz_documents"."revision" + 1,
        "updatedAt" = EXCLUDED."updatedAt"
    RETURNING "id" INTO document_id;

    INSERT INTO "tloz_mission_documents" (
        "documentId", "projectId", "ownerId", "category", "status", "icon",
        "startDate", "dueDate", "completedAt", "blockedReason", "progress"
    ) VALUES (
        document_id, project_document_id, NEW."ownerId", NEW."type", NEW."status",
        NEW."icon", NEW."startDate", NEW."dueDate", NEW."completedAt",
        NEW."blockedReason", NEW."progress"
    )
    ON CONFLICT ("documentId") DO UPDATE SET
        "projectId" = EXCLUDED."projectId",
        "ownerId" = EXCLUDED."ownerId",
        "category" = EXCLUDED."category",
        "status" = EXCLUDED."status",
        "icon" = EXCLUDED."icon",
        "startDate" = EXCLUDED."startDate",
        "dueDate" = EXCLUDED."dueDate",
        "completedAt" = EXCLUDED."completedAt",
        "blockedReason" = EXCLUDED."blockedReason",
        "progress" = EXCLUDED."progress";

    INSERT INTO "tloz_field_values" (
        "documentId", "fieldDefinitionId", "stringValue"
    )
    SELECT
        document_id,
        definition."id",
        CASE definition."key" WHEN 'status' THEN NEW."status" ELSE NEW."type" END
    FROM "tloz_field_definitions" definition
    WHERE definition."projectId" = project_document_id
        AND definition."key" IN ('status', 'category')
    ON CONFLICT ("documentId", "fieldDefinitionId") DO UPDATE SET
        "stringValue" = EXCLUDED."stringValue",
        "updatedAt" = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tloz_next_inventory_public_id()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('tloz-inventory-public-id'));
    SELECT COALESCE(MAX(substring("publicId" FROM 5)::integer), 0) + 1
    INTO next_number
    FROM "tloz_documents"
    WHERE "kind" = 'inventory' AND "publicId" ~ '^INV-[0-9]+$';
    RETURN 'INV-' || lpad(next_number::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tloz_sync_inventory_document()
RETURNS TRIGGER AS $$
DECLARE
    document_id UUID;
    project_document_id UUID;
    existing_public_id TEXT;
BEGIN
    IF current_setting('tloz.sync_origin', true) = 'document' THEN
        RETURN NEW;
    END IF;

    SELECT "id" INTO project_document_id
    FROM "tloz_documents" WHERE "publicId" = 'project-inventory';
    SELECT "publicId" INTO existing_public_id
    FROM "tloz_documents"
    WHERE "sourceType" = 'inventory' AND "sourceId" = NEW."id"::text;

    INSERT INTO "tloz_documents" (
        "publicId", "kind", "projectId", "title", "summary", "body",
        "sourceType", "sourceId", "createdAt", "updatedAt"
    ) VALUES (
        COALESCE(existing_public_id, tloz_next_inventory_public_id()),
        'inventory', project_document_id, NEW."name", NEW."description",
        NEW."descriptionDetail", 'inventory', NEW."id"::text,
        NEW."createdAt", NEW."updatedAt"
    )
    ON CONFLICT ("sourceType", "sourceId") DO UPDATE SET
        "title" = EXCLUDED."title",
        "summary" = EXCLUDED."summary",
        "body" = EXCLUDED."body",
        "revision" = "tloz_documents"."revision" + 1,
        "updatedAt" = EXCLUDED."updatedAt"
    RETURNING "id" INTO document_id;

    INSERT INTO "tloz_inventory_documents" (
        "documentId", "projectId", "ownerId", "category", "status", "icon", "acquiredAt"
    ) VALUES (
        document_id, project_document_id, NEW."ownerId", NEW."category",
        NEW."status", NEW."icon", NEW."acquiredAt"
    )
    ON CONFLICT ("documentId") DO UPDATE SET
        "ownerId" = EXCLUDED."ownerId",
        "category" = EXCLUDED."category",
        "status" = EXCLUDED."status",
        "icon" = EXCLUDED."icon",
        "acquiredAt" = EXCLUDED."acquiredAt";

    INSERT INTO "tloz_field_values" (
        "documentId", "fieldDefinitionId", "stringValue"
    )
    SELECT
        document_id,
        definition."id",
        CASE definition."key" WHEN 'status' THEN NEW."status" ELSE NEW."category" END
    FROM "tloz_field_definitions" definition
    WHERE definition."projectId" = project_document_id
        AND definition."key" IN ('status', 'category')
    ON CONFLICT ("documentId", "fieldDefinitionId") DO UPDATE SET
        "stringValue" = EXCLUDED."stringValue",
        "updatedAt" = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tloz_delete_source_document()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM "tloz_documents"
    WHERE "sourceType" = TG_ARGV[0] AND "sourceId" = OLD."id"::text;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tloz_sync_resource_document()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."documentId" IS NOT NULL THEN
        RETURN NEW;
    END IF;
    SELECT "id" INTO NEW."documentId"
    FROM "tloz_documents"
    WHERE
        (NEW."missionId" IS NOT NULL AND "sourceType" = 'mission' AND "sourceId" = NEW."missionId"::text)
        OR (NEW."projectId" IS NOT NULL AND "sourceType" = 'project' AND "sourceId" = NEW."projectId"::text)
        OR (NEW."questItemId" IS NOT NULL AND "sourceType" = 'inventory' AND "sourceId" = NEW."questItemId"::text)
    LIMIT 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tloz_sync_dependency_relation()
RETURNS TRIGGER AS $$
DECLARE
    source_document_id UUID;
    target_document_id UUID;
    mission_id TEXT;
    dependency_id TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        mission_id := OLD."missionId"::text;
        dependency_id := OLD."dependsOnMissionId"::text;
    ELSE
        mission_id := NEW."missionId"::text;
        dependency_id := NEW."dependsOnMissionId"::text;
    END IF;
    SELECT "id" INTO source_document_id
    FROM "tloz_documents"
    WHERE "sourceType" = 'mission'
        AND "sourceId" = mission_id;
    SELECT "id" INTO target_document_id
    FROM "tloz_documents"
    WHERE "sourceType" = 'mission'
        AND "sourceId" = dependency_id;

    IF TG_OP = 'DELETE' THEN
        DELETE FROM "tloz_document_relations"
        WHERE "sourceDocumentId" = source_document_id
            AND "targetDocumentId" = target_document_id
            AND "relationType" = 'depends_on';
        RETURN OLD;
    END IF;

    IF source_document_id IS NOT NULL AND target_document_id IS NOT NULL THEN
        INSERT INTO "tloz_document_relations" (
            "sourceDocumentId", "targetDocumentId", "relationType"
        ) VALUES (
            source_document_id, target_document_id, 'depends_on'
        )
        ON CONFLICT ("sourceDocumentId", "targetDocumentId", "relationType") DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tloz_sync_inventory_relation()
RETURNS TRIGGER AS $$
DECLARE
    source_document_id UUID;
    target_document_id UUID;
    mission_id TEXT;
    inventory_id TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        mission_id := OLD."missionId"::text;
        inventory_id := OLD."questItemId"::text;
    ELSE
        mission_id := NEW."missionId"::text;
        inventory_id := NEW."questItemId"::text;
    END IF;
    SELECT "id" INTO source_document_id
    FROM "tloz_documents"
    WHERE "sourceType" = 'mission'
        AND "sourceId" = mission_id;
    SELECT "id" INTO target_document_id
    FROM "tloz_documents"
    WHERE "sourceType" = 'inventory'
        AND "sourceId" = inventory_id;

    IF TG_OP = 'DELETE' THEN
        DELETE FROM "tloz_document_relations"
        WHERE "sourceDocumentId" = source_document_id
            AND "targetDocumentId" = target_document_id
            AND "relationType" = 'uses_inventory';
        RETURN OLD;
    END IF;

    IF source_document_id IS NOT NULL AND target_document_id IS NOT NULL THEN
        INSERT INTO "tloz_document_relations" (
            "sourceDocumentId", "targetDocumentId", "relationType", "required"
        ) VALUES (
            source_document_id, target_document_id, 'uses_inventory', NEW."required"
        )
        ON CONFLICT ("sourceDocumentId", "targetDocumentId", "relationType") DO UPDATE SET
            "required" = EXCLUDED."required";
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "tloz_projects_document_sync"
AFTER INSERT OR UPDATE ON "tloz_projects"
FOR EACH ROW EXECUTE FUNCTION tloz_sync_project_document();
CREATE TRIGGER "tloz_projects_document_delete"
AFTER DELETE ON "tloz_projects"
FOR EACH ROW EXECUTE FUNCTION tloz_delete_source_document('project');
CREATE TRIGGER "tloz_missions_document_sync"
AFTER INSERT OR UPDATE ON "tloz_missions"
FOR EACH ROW EXECUTE FUNCTION tloz_sync_mission_document();
CREATE TRIGGER "tloz_missions_document_delete"
AFTER DELETE ON "tloz_missions"
FOR EACH ROW EXECUTE FUNCTION tloz_delete_source_document('mission');
CREATE TRIGGER "tloz_inventory_document_sync"
AFTER INSERT OR UPDATE ON "tloz_quest_items"
FOR EACH ROW EXECUTE FUNCTION tloz_sync_inventory_document();
CREATE TRIGGER "tloz_inventory_document_delete"
AFTER DELETE ON "tloz_quest_items"
FOR EACH ROW EXECUTE FUNCTION tloz_delete_source_document('inventory');
CREATE TRIGGER "tloz_resources_document_sync"
BEFORE INSERT OR UPDATE ON "tloz_resources"
FOR EACH ROW EXECUTE FUNCTION tloz_sync_resource_document();
CREATE TRIGGER "tloz_dependencies_document_sync"
AFTER INSERT OR UPDATE OR DELETE ON "tloz_mission_dependencies"
FOR EACH ROW EXECUTE FUNCTION tloz_sync_dependency_relation();
CREATE TRIGGER "tloz_inventory_links_document_sync"
AFTER INSERT OR UPDATE OR DELETE ON "tloz_mission_quest_items"
FOR EACH ROW EXECUTE FUNCTION tloz_sync_inventory_relation();
