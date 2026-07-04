# Zipform Data API

## Objective

Version 1.1.0 introduces a documented, read-only API for querying Zipform data without requiring direct database access. The first contract covers users and TLOZ projects, including the lookup used to answer questions such as which username belongs to a known email address.

The source of truth is [`openapi.yaml`](./openapi.yaml). OpenAPI defines the machine-readable HTTP contract; Swagger UI will render that contract and provide an authenticated explorer.

## Initial scope

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/users` | List users or filter by exact email/username |
| `GET /api/v1/users/{userId}` | Retrieve one user by ID |
| `GET /api/v1/projects` | List TLOZ projects with optional owner/status filters |
| `GET /api/v1/projects/{projectId}` | Retrieve one project by ID |
| `GET /api/openapi` | Serve the OpenAPI document |
| `GET /api-docs` | Render Swagger UI |

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

### Phase 1 — Contract and validation

- Keep `openapi.yaml` versioned with the application.
- Add OpenAPI linting to CI.
- Add contract tests for status codes, response envelopes, and excluded sensitive fields.

### Phase 2 — Read-only handlers

- Extend `TlozRepository` with paginated user/project queries.
- Implement the four `/api/v1` endpoints.
- Add authentication, filter validation, pagination, and typed error mapping.
- Add integration tests against PostgreSQL and authorization tests for Route Handlers.

### Phase 3 — Swagger UI

- Serve the specification from `/api/openapi`.
- Mount Swagger UI at `/api-docs` with “Try it out” using the browser's authenticated session.
- Add CSP-compatible assets, `noindex`, loading, and error states.

### Phase 4 — Operational hardening

- Add request IDs and structured server logs.
- Add conservative per-user rate limits before exposing broader datasets.
- Document API versioning and deprecation policy before introducing write endpoints.

## Definition of done for the initial API

- The OpenAPI document passes linting in CI.
- Every documented operation has authentication and automated tests.
- Swagger UI can execute a user lookup from an authenticated Preview deployment.
- Responses never include password hashes, session data, or secrets.
- Pagination has deterministic ordering and a maximum page size of 100.
- Runtime errors use a stable error code and request ID without exposing stack traces.
