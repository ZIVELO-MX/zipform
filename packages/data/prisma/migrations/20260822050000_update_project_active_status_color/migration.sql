UPDATE "tloz_document_definitions"
SET
  "fields" = jsonb_set(
    "fields",
    '{2,options,1,color}',
    '"#4B8D5E"'::jsonb
  ),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'projects'
  AND "fields" #>> '{2,key}' = 'status'
  AND "fields" #>> '{2,options,1,value}' = 'active';
