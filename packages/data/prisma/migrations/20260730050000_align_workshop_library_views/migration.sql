UPDATE "containers"
SET
  "definition" = CASE "id"
    WHEN 'system-workshop' THEN
      '{"fields":[{"key":"status","label":"Estado","format":"status","visible":true,"defaultValue":"active","options":[{"value":"planned","label":"Planeado","role":"backlog","color":"#3A47B5"},{"value":"active","label":"Activo","role":"active","color":"#1E6B3C"},{"value":"archived","label":"Archivado","role":"done","color":"#6B6B6B"}]},{"key":"category","label":"Categoría","format":"text","visible":true,"defaultValue":"normal"},{"key":"ownerId","label":"Responsable","format":"person","visible":true},{"key":"startDate","label":"Inicio","format":"date","visible":true},{"key":"dueDate","label":"Vence","format":"date","visible":true}],"views":[{"id":"list","fields":["title","status"]},{"id":"table","fields":["title","status","category","ownerId","dueDate"]},{"id":"detail","fields":["publicId","status","category","ownerId","startDate","dueDate"]}],"defaultView":"table"}'::jsonb
    WHEN 'system-library' THEN
      '{"fields":[{"key":"status","label":"Estado","format":"status","visible":true,"defaultValue":"locked","options":[{"value":"locked","label":"Bloqueado","role":"backlog","color":"#7A5A12"},{"value":"unlocked","label":"Desbloqueado","role":"done","color":"#1E6B3C"}]},{"key":"category","label":"Categoría","format":"text","visible":true,"defaultValue":"other","options":[{"value":"tool","label":"Herramienta"},{"value":"access","label":"Acceso"},{"value":"asset","label":"Activo"},{"value":"document","label":"Documento"},{"value":"other","label":"Otro"}]},{"key":"ownerId","label":"Responsable","format":"person","visible":true},{"key":"acquiredAt","label":"Adquirido","format":"date","visible":true}],"views":[{"id":"list","fields":["title","status"]},{"id":"table","fields":["title","status","category","ownerId","acquiredAt"]},{"id":"detail","fields":["publicId","status","category","ownerId","acquiredAt"]}],"defaultView":"table"}'::jsonb
  END,
  "revision" = "revision" + 1,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" IN ('system-workshop', 'system-library');
