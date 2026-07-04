# Zipform Data API

## Objective

Version 1.1.0 introduces a documented, read-only API for querying Zipform data without requiring direct database access. The contract covers all major entities: users, projects, missions, seasons, episodes, quest items, and resources.

The source of truth is [`openapi.yaml`](./openapi.yaml). OpenAPI defines the machine-readable HTTP contract; Swagger UI will render that contract and provide an authenticated explorer.

## Endpoints

| Endpoint | Purpose | Pagination |
|---|---|---|
| `GET /api/v1/users` | List users or filter by email/username | ✅ cursor |
| `GET /api/v1/users/{userId}` | Retrieve one user by ID | — |
| `GET /api/v1/projects` | List projects with owner/status filters | ✅ cursor |
| `GET /api/v1/projects/{projectId}` | Retrieve one project by ID | — |
| `GET /api/v1/missions` | List missions with project/owner/status/season/episode/title filters | ✅ cursor |
| `GET /api/v1/missions/{missionId}` | Mission detail with checklist, resources, dependencies | — |
| `GET /api/v1/seasons` | List all seasons | — |
| `GET /api/v1/episodes` | List episodes, optional filter by seasonId | — |
| `GET /api/v1/quest-items` | List quest items with owner/status/category filters | ✅ cursor |
| `GET /api/v1/resources` | List resources filtered by owner entity or type | ✅ cursor |
| `GET /api/openapi` | Serve the OpenAPI document | — |
| `GET /api-docs` | Render Swagger UI | — |

The API must never serialize `passwordHash`, session tokens, database URLs, or internal authentication secrets.

## Architecture

```text
Swagger UI (/api-docs)
        │ reads
        ▼
OpenAPI document (/api/openapi)
        │ describes
        ▼
Next.js Route Handlers (/api/v1/*)
        │ auth() + validation
        ▼
@zipform/data repositories
        │
        ▼
PostgreSQL
```

- Implement endpoints as Next.js Route Handlers under `apps/dashboard/app/api/v1`.
- Authenticate every data request with the existing NextAuth session.
- Query through `@zipform/data`; route handlers must not construct SQL or instantiate a second Prisma client.
- Validate path and query inputs before calling the repository.
- Return the shared `ApiError` envelope for expected failures.
- Keep Swagger UI disabled from indexing and require the same authenticated session as the API.

## Example lookup

```http
GET /api/v1/users?email=benjamin.rodriguez%40zivelo.dev
Accept: application/json
```

```json
{
  "data": [
    {
      "id": "benji",
      "name": "Benji Rodriguez",
      "username": "benrod",
      "email": "benjamin.rodriguez@zivelo.dev",
      "role": "Platform Owner",
      "avatarUrl": "https://example.invalid/avatar.jpg"
    }
  ],
  "page": {
    "nextCursor": null
  }
}
```

## Delivery plan

### Phase 1 — Contract and validation ✅

- Keep `openapi.yaml` versioned with the application.

### Phase 2 — Read-only handlers ✅

- Extend `TlozRepository` with paginated queries for all entity types.
- Implement all `/api/v1` endpoints (users, projects, missions, seasons, episodes, quest items, resources).
- Authentication, filter validation, pagination, and typed error mapping.

### Phase 3 — Swagger UI ✅

- Serve the specification from `/api/openapi`.
- Mount Swagger UI at `/api-docs` with "Try it out" using the browser's authenticated session.
- `noindex` to prevent search indexing.

### Phase 4 — Operational hardening

- Add request IDs and structured server logs.
- Add conservative per-user rate limits.
- Document API versioning and deprecation policy.

## Definition of done for the initial API

- The OpenAPI document passes linting in CI.
- Every documented operation has authentication and automated tests.
- Swagger UI can execute a user lookup from an authenticated Preview deployment.
- Responses never include password hashes, session data, or secrets.
- Pagination has deterministic ordering and a maximum page size of 100.
- Runtime errors use a stable error code and request ID without exposing stack traces.
