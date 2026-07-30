-- Safety gate: Prisma deployments do not set this session variable, so this is a no-op
-- until the operator has supplied the evidence flags and explicitly opened the window.
DO $$
BEGIN
  IF current_setting('tloz.allow_legacy_retirement', true) = 'on' THEN
    DROP TABLE IF EXISTS "tloz_document_relations";
    DROP TABLE IF EXISTS "tloz_field_values";
    DROP TABLE IF EXISTS "tloz_field_definitions";
    DROP TABLE IF EXISTS "tloz_inventory_documents";
    DROP TABLE IF EXISTS "tloz_mission_documents";
    DROP TABLE IF EXISTS "tloz_project_documents";
    DROP TABLE IF EXISTS "tloz_documents";
    DROP TABLE IF EXISTS "tloz_document_definitions";
  END IF;
END $$;
