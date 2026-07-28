# TLOZ

TLOZ is Zivelo's document-based workspace for Projects, Missions, and Inventory.
The repository contains the product dashboard, shared UI, data repositories,
Prisma schema, migrations, and the TLOZ Data API.

## Document model

Every entity is a document with a stable public ID, Markdown body, typed
properties, revision, and optional Project parent.

- **Project** describes a body of work and defines the field contract inherited
  by its Missions.
- **Mission** belongs to one Project and uses that Project's status, category,
  and custom field definitions.
- **Inventory** is stored under the system Project `project-inventory` and keeps
  only the properties required by its document.

The database is canonical. Markdown with YAML frontmatter is the portable
import/export and API representation; the product UI remains visual.

```md
---
id: TLO-0023
type: mission
parent: project-tloz
status: in-progress
priority: high
assignee: execution-agent
branch: mission-023
pr: null
---

# Mejorar el pipeline de previews

## Alcance

Crear un único preview actualizado para la rama principal.
```

## Routes

- `/` — global lobby
- `/:projectSlug` — Mission workspace for a Project
- `/:projectSlug/:missionId` — Mission document
- `/projects` and `/projects/:projectSlug` — Project collection and contract
- `/inventory` and `/inventory/:inventoryId` — Inventory collection and document
- `/api/v2/documents` — JSON/Markdown document API

The previous `/tloz` prefix is no longer an application mount. `/tloz` now
means the Project whose slug is `tloz`.

## Development

```bash
pnpm install
pnpm dev
```

Use `TLOZ_DATA_DRIVER=mock` for the in-memory driver or configure PostgreSQL
and use `TLOZ_DATA_DRIVER=prisma`. `ZIPFORM_*` environment variables and
existing `zaf_` API keys are accepted for one compatibility release; new keys
use the `tloz_` prefix.

## Verification

```bash
pnpm check
```

Pull requests run Prisma generation, type checking, tests (including the
OpenAPI contract), and the production build. Database migrations are additive
and must never be deleted or rewritten.
