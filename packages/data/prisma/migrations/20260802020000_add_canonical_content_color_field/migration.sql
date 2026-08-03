UPDATE "containers"
SET "definition" = jsonb_set(
  "definition",
  '{fields}',
  ("definition"->'fields') || '{"key":"color","label":"Color","format":"text","visible":true,"defaultValue":"#2D6CDF"}'::jsonb
),
"revision" = "revision" + 1,
"updatedAt" = CURRENT_TIMESTAMP
WHERE "id" IN ('system-workshop', 'system-library')
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements("definition"->'fields') AS field
    WHERE field->>'key' = 'color'
  );
