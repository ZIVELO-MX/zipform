UPDATE "tloz_projects"
SET "status" = CASE "status"
  WHEN 'planned' THEN 'paused'
  WHEN 'archived' THEN 'completed'
  ELSE "status"
END
WHERE "status" IN ('planned', 'archived');

UPDATE "tloz_project_documents"
SET "status" = CASE "status"
  WHEN 'planned' THEN 'paused'
  WHEN 'archived' THEN 'completed'
  ELSE "status"
END
WHERE "status" IN ('planned', 'archived');

WITH rebuilt AS (
  SELECT
    definition."id",
    jsonb_agg(
      CASE
        WHEN field.value ->> 'key' = 'status' THEN jsonb_set(
          field.value,
          '{options}',
          '[
            {"value":"active","label":"Active","role":"active","color":"#4B8D5E"},
            {"value":"maintenance","label":"Maintenance","role":"ready","color":"#3B82F6"},
            {"value":"paused","label":"Paused / Blocked","role":"blocked","color":"#6B7280"},
            {"value":"completed","label":"Completed","role":"done","color":"#166534"}
          ]'::jsonb,
          true
        )
        ELSE field.value
      END
      ORDER BY field.position
    ) AS "fields"
  FROM "tloz_document_definitions" definition
  CROSS JOIN LATERAL jsonb_array_elements(definition."fields")
    WITH ORDINALITY AS field(value, position)
  WHERE definition."key" = 'projects'
  GROUP BY definition."id"
)
UPDATE "tloz_document_definitions" definition
SET
  "fields" = rebuilt."fields",
  "updatedAt" = CURRENT_TIMESTAMP
FROM rebuilt
WHERE definition."id" = rebuilt."id";
