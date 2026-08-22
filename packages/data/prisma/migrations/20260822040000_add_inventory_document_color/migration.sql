ALTER TABLE "tloz_inventory_documents"
ADD COLUMN "color" TEXT NOT NULL DEFAULT '#2D6CDF';

UPDATE "tloz_inventory_documents" AS inventory
SET "color" = item."color"
FROM "tloz_documents" AS document
JOIN "tloz_quest_items" AS item
  ON item."id"::text = document."sourceId"
WHERE document."id" = inventory."documentId"
  AND document."sourceType" = 'inventory';

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
        "documentId", "projectId", "ownerId", "category", "status", "icon", "color", "acquiredAt"
    ) VALUES (
        document_id, project_document_id, NEW."ownerId", NEW."category",
        NEW."status", NEW."icon", upper(NEW."color"), NEW."acquiredAt"
    )
    ON CONFLICT ("documentId") DO UPDATE SET
        "ownerId" = EXCLUDED."ownerId",
        "category" = EXCLUDED."category",
        "status" = EXCLUDED."status",
        "icon" = EXCLUDED."icon",
        "color" = EXCLUDED."color",
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
