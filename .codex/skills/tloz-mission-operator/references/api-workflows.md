# API workflows

Consult `GET https://zipform.zivelo.dev/api/openapi` before relying on this route summary.

## Core routes

- Projects: `GET/POST /api/v1/projects`, `GET/PATCH /api/v1/projects/{projectId}`.
- Missions: `GET/POST /api/v1/missions`, `GET/PATCH/DELETE /api/v1/missions/{missionId}`.
- Mission state: `PATCH /api/v1/missions/{missionId}/status`.
- Mission detail: `PUT /api/v1/missions/{missionId}/document` with `{ "markdown": "complete Markdown detail" }`; it updates `descriptionDetail` and materializes checklist metrics.
- Discovery: `GET /api/v1/users/me`, `GET /api/v1/agents`, `GET /api/v1/users`.
- Supporting data: `GET /api/v1/seasons`, `/episodes`, `/quest-items`, and `/resources`.
- Query by example: `POST /api/v1/{missions|projects|quest-items|resources|users}/query`.

## Discover assigned work

When the user does not identify a mission, resolve `GET /api/v1/users/me` first and query missions with that returned `ownerId`. Within the requested project, if any, prefer `now`, then `next`, then `later`; skip `completed` and `blocked` unless requested. An explicit mission identifier always takes precedence over owner-first discovery.

If no assigned mission is actionable, report that result before searching other owners. Reading another owner's mission is allowed, but implementing its primary deliverable requires explicit reassignment followed by a verification GET.

## Create a mission

1. Resolve the project and inspect similar missions.
2. Read the current `createMission` schema from OpenAPI.
3. Prepare a concise title and complete Markdown document.
4. Use only documented fields and enum values.
5. `POST /api/v1/missions` and read the returned internal ID.
6. `GET /api/v1/missions/{id}` and verify persisted fields.

Set `ownerId` only when required by the current creation schema and authorized by the user. Follow the ownership and execution rules in `SKILL.md`; assigning a mission does not authorize the agent to perform another owner's primary deliverable.

## Relationships

Before adding a dependency, resource, or quest item, retrieve the mission, confirm the referenced entity exists, and check that the relationship is absent. Mutate through the documented relationship endpoint and GET the mission again.

- Dependencies: `POST /api/v1/missions/{id}/dependencies`; delete with `DELETE /api/v1/missions/{id}/dependencies/{dependencyId}`.
- Resources: `POST /api/v1/missions/{id}/resources`; delete with `DELETE /api/v1/missions/{id}/resources/{resourceId}`.
- Quest items: `POST /api/v1/missions/{id}/quest-items`; delete with `DELETE /api/v1/missions/{id}/quest-items/{questItemId}`.

Do not infer dependencies from related wording alone.

## Delete a mission

Only delete after retrieving the mission and matching both `displayId` and title against an explicit user request. Execute the DELETE once, then verify absence when the API supports it. Removing a checkbox or relationship never authorizes mission deletion.
