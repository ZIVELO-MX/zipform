# TLOZ Product Direction

TLOZ is Zivelo's operational document system. The repository, product surface,
API, and deployment belong exclusively to TLOZ.

## Document model

Project, Mission, and Inventory are three specializations of one document
primitive:

- A Project describes an initiative and defines the field contract inherited by
  its Missions.
- A Mission belongs to one Project and stores values that satisfy that Project's
  contract.
- Inventory stores the information required to operate a reusable asset or
  reference.

Every document has a stable public ID, YAML-compatible properties, a Markdown
body, resources, revision metadata, and shared general views. Type-specific
views extend this common surface.

## Project contracts

Each Project owns the schema for its Missions. The default contract includes
status and category, while every Project may define its own options and add
text, number, boolean, date, select, multiselect, person, or relation fields.

Status options include a semantic workflow role so generic views can understand
custom workflows without depending on fixed labels:

- `backlog`
- `ready`
- `active`
- `blocked`
- `done`

Retiring a field hides it from new edits without destroying historical values.

## Markdown representation

Documents can be exchanged as Markdown with YAML frontmatter:

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

The structured API and Markdown representation are two projections of the same
record, protected with document revisions.

## Product principles

- Keep the interface compact, direct, and operational.
- Reuse document components and views before adding type-specific variants.
- Let Project contracts drive Mission forms, filters, boards, and validation.
- Preserve data during schema evolution and legacy compatibility.
- Prefer stable public document IDs and canonical root routes.

## Canonical routes

- `/` — global document lobby
- `/:projectSlug` — Project Mission workspace
- `/:projectSlug/:missionId` — Mission document
- `/projects` and `/projects/:projectSlug` — Project documents and contracts
- `/inventory` and `/inventory/:inventoryId` — Inventory documents

The former `/tloz` prefix remains meaningful only as the Project whose slug is
`tloz`; legacy nested routes redirect during one compatibility release.
