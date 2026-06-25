# Pending Decisions

Whenever implementation requires making a product decision that is not specified,
do not invent it.

Instead:

- implement a reasonable placeholder
- leave a TODO
- document it here

## Product decisions left unresolved by the dashboard implementation

- Creation behavior: `Nueva Mission` is visible but disabled because required fields, quick-create versus detailed-create flow, validation, and multi-create behavior are not specified.
- Editing behavior: edit actions are visible but non-persistent because field-level editability, optimistic updates, validation, and history semantics are not specified.
- Persistence: TLOZ currently reads from an async mock repository in `apps/dashboard/lib/tloz-data.ts`; the real database driver, migrations, IDs, and replacement boundary still need a product and technical decision.
- Permissions: ownership is shown from mock data, but who can create, edit, complete, block, delete, or assign Missions is unresolved.
- Activity semantics: Mission Detail includes an activity placeholder; the exact event list, retention, user attribution, and distinction between visible activity and audit logs are unresolved.
- Resource uploads: resources are displayed from mock metadata only; upload destinations, accepted file types, file size limits, previews, access control, and deletion behavior are unresolved.
- Search integration: filters and search are local placeholders; global command/search behavior across Missions, Proyectos, Quest Items, and Recursos is unresolved.
