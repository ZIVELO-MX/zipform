CREATE TABLE "tloz_document_definitions" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "ownerDocumentId" UUID,
    "fields" JSONB NOT NULL,
    "views" JSONB NOT NULL,
    "defaultView" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tloz_document_definitions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tloz_document_definitions_key_key"
ON "tloz_document_definitions"("key");

CREATE INDEX "tloz_document_definitions_kind_scope_idx"
ON "tloz_document_definitions"("kind", "scope");

CREATE INDEX "tloz_document_definitions_ownerDocumentId_idx"
ON "tloz_document_definitions"("ownerDocumentId");

ALTER TABLE "tloz_document_definitions"
ADD CONSTRAINT "tloz_document_definitions_ownerDocumentId_fkey"
FOREIGN KEY ("ownerDocumentId") REFERENCES "tloz_documents"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "tloz_document_definitions"
    ("id", "key", "kind", "scope", "fields", "views", "defaultView", "createdAt", "updatedAt")
VALUES
    (
        gen_random_uuid(),
        'projects',
        'project',
        'collection',
        '[
          {"key":"publicId","label":"ID","format":"id","position":0,"visible":true},
          {"key":"title","label":"Project","format":"text","position":1,"visible":true},
          {"key":"status","label":"Estado","format":"status","position":2,"visible":true,"options":[
            {"value":"planned","label":"Planeado","role":"backlog","color":"#3A47B5"},
            {"value":"active","label":"Activo","role":"active","color":"#1E6B3C"},
            {"value":"archived","label":"Archivado","role":"done","color":"#6B6B6B"}
          ]},
          {"key":"category","label":"Tipo","format":"text","position":3,"visible":true},
          {"key":"mission_count","label":"Missions","format":"number","position":4,"visible":true},
          {"key":"due","label":"Vence","format":"date","position":5,"visible":true}
        ]'::jsonb,
        '[
          {"id":"table","fields":["title","status","category","mission_count","due"]},
          {"id":"list","fields":["title","status"]},
          {"id":"detail","fields":["publicId","status","category","owner","start","due","mission_count"]}
        ]'::jsonb,
        'table',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'inventory',
        'inventory',
        'collection',
        '[
          {"key":"publicId","label":"ID","format":"id","position":0,"visible":true},
          {"key":"title","label":"Inventory item","format":"text","position":1,"visible":true},
          {"key":"status","label":"Estado","format":"status","position":2,"visible":true,"options":[
            {"value":"locked","label":"Bloqueado","role":"backlog","color":"#7A5A12"},
            {"value":"unlocked","label":"Desbloqueado","role":"done","color":"#1E6B3C"}
          ]},
          {"key":"category","label":"Categoría","format":"text","position":3,"visible":true,"options":[
            {"value":"tool","label":"Herramienta"},
            {"value":"access","label":"Acceso"},
            {"value":"asset","label":"Activo"},
            {"value":"document","label":"Documento"},
            {"value":"other","label":"Otro"}
          ]},
          {"key":"assignee","label":"Responsable","format":"person","position":4,"visible":true},
          {"key":"acquired","label":"Adquirido","format":"date","position":5,"visible":true}
        ]'::jsonb,
        '[
          {"id":"table","fields":["title","status","category","assignee","acquired"]},
          {"id":"list","fields":["title","status"]},
          {"id":"detail","fields":["publicId","status","category","assignee","acquired"]}
        ]'::jsonb,
        'table',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

INSERT INTO "tloz_document_definitions"
    ("id", "key", "kind", "scope", "ownerDocumentId", "fields", "views", "defaultView", "createdAt", "updatedAt")
SELECT
    gen_random_uuid(),
    'project:' || d."id"::text || ':children',
    'mission',
    'children',
    d."id",
    '[]'::jsonb,
    '[
      {"id":"dashboard","fields":["title","status","category","assignee","due","progress"]},
      {"id":"list","fields":["title","status","category","assignee","due"]},
      {"id":"board","fields":["title","status","category","assignee","due"],"groupBy":"status"},
      {"id":"table","fields":["title","status","category","assignee","due","progress"]},
      {"id":"calendar","fields":["title","status","assignee","due"],"dateField":"due"},
      {"id":"detail","fields":["publicId","status","category","assignee","start","due","progress","blocked_reason"]}
    ]'::jsonb,
    'dashboard',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "tloz_documents" d
WHERE d."kind" = 'project'
  AND d."publicId" <> 'project-inventory'
ON CONFLICT ("key") DO NOTHING;

CREATE OR REPLACE FUNCTION "tloz_create_project_children_definition"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."publicId" <> 'project-inventory' THEN
    INSERT INTO "tloz_document_definitions"
      ("id", "key", "kind", "scope", "ownerDocumentId", "fields", "views", "defaultView", "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(),
      'project:' || NEW."id"::text || ':children',
      'mission',
      'children',
      NEW."id",
      '[]'::jsonb,
      '[
        {"id":"dashboard","fields":["title","status","category","assignee","due","progress"]},
        {"id":"list","fields":["title","status","category","assignee","due"]},
        {"id":"board","fields":["title","status","category","assignee","due"],"groupBy":"status"},
        {"id":"table","fields":["title","status","category","assignee","due","progress"]},
        {"id":"calendar","fields":["title","status","assignee","due"],"dateField":"due"},
        {"id":"detail","fields":["publicId","status","category","assignee","start","due","progress","blocked_reason"]}
      ]'::jsonb,
      'dashboard',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("key") DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "tloz_project_children_definition_insert"
AFTER INSERT ON "tloz_documents"
FOR EACH ROW
WHEN (NEW."kind" = 'project')
EXECUTE FUNCTION "tloz_create_project_children_definition"();
