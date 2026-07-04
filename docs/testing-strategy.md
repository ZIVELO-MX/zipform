# Zipform Testing Strategy

## Current State

- **Unit tests** via Vitest: mock driver (`mock.test.ts`, 6 tests) and stubbed Prisma driver (`prisma.test.ts`, 2 tests)
- **CI** (`ci.yml`): runs `pnpm check` with `ZIPFORM_DATA_DRIVER=mock`; Prisma receives non-secret placeholder PostgreSQL URLs but no database is contacted
- **Coverage**: 70% minimum thresholds (lines, functions, statements, branches)
- **No integration tests** against a real PostgreSQL database exist today

## Proposed Testing Pyramid

```
         ╱  e2e (future)  ╲
        ╱────────────────────╲
       ╱  integration tests   ╲   ← NEW: Prisma x PostgreSQL
      ╱────────────────────────╲
     ╱   unit tests (existing)  ╲
    ╱────────────────────────────╲
   ╱    static analysis + lint    ╲
```

### 1. Static Analysis — Base of the Pyramid

- **TypeScript**: `tsc --noEmit` in every package
- **Next.js build checks**: production compilation and framework lint/type validation
- Run on every push/PR via `pnpm check`

### 2. Unit Tests — Existing, strengthen

- **Mock driver tests** (`mock.test.ts`): pure logic, no DB. Tests TlozRepository contract via in-memory implementation.
- **Stubbed Prisma tests** (`prisma.test.ts`): stubbed PrismaClient via `vi.fn()`. Proves the driver translates Prisma calls correctly without a real DB.
- **Validation/hydration tests**: edge cases for `tloz-validation.ts`, `tloz-hydration.ts`, `dependency-rules.ts`.

All unit tests run in CI with `ZIPFORM_DATA_DRIVER=mock` — no external dependencies.

The required pull-request gate is the root `pnpm check` command. It runs, in order:

1. Prisma client generation
2. TypeScript checks for every workspace package
3. Unit tests for every workspace package
4. The production dashboard build

Prisma loads and validates `DATABASE_URL` and `DIRECT_URL` during client generation. CI therefore defines syntactically valid placeholder PostgreSQL URLs for both variables. They are configuration inputs only: the mock driver prevents the test and build phases from opening a database connection.

### 3. Integration Tests — Planned

Test the real Prisma driver (`createPrismaDataClient`) against a real PostgreSQL instance:

- **Approach**: Use `@testcontainers/postgresql` (or `supabase local start`) to spin up a fresh PostgreSQL container per test run
- **Run mode**: opt-in via `INTEGRATION=true` env var; excluded from default `pnpm test`
- **CI**: enabled on scheduled runs or with a workflow matrix flag
- **What they cover**:
  - Write path (create, update, delete) round-trip through Prisma
  - Transaction correctness (saveMissionDocument atomicity)
  - Filter query accuracy (getMissions filters, getMissionDetail hydration)
  - Concurrent operations (two simultaneous updates)
  - Error handling (duplicate key, FK violation, missing record)

### 4. E2E Tests — Future

- Playwright tests against the full Next.js app
- Authenticated session, real Supabase connection
- Covers user flows: create/edit/delete missions, drag-and-drop, dashboard load

## Test Infrastructure

### Local Development

```bash
# Unit tests (default, no DB needed)
pnpm test

# Coverage
pnpm test:coverage
```

### Database per Test Run

Each integration test run:

1. Starts a PostgreSQL container via testcontainers (or connects to `TEST_DATABASE_URL`)
2. Sets both `DATABASE_URL` and `DIRECT_URL` to the isolated test database
3. Applies all Prisma migrations via `prisma migrate deploy`
4. Seeds required reference data (users, projects)
5. Runs all integration tests against that database
6. Drops the container on completion, including after failures

### Planned Integration CI Strategy

```yaml
# In ci.yml, add a matrix:
jobs:
  test:
    strategy:
      matrix:
        type: [unit, integration]
    env:
      ZIPFORM_DATA_DRIVER: ${{ matrix.type == 'unit' && 'mock' || 'prisma' }}
    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_USER: zipform
          POSTGRES_PASSWORD: zipform
          POSTGRES_DB: zipform_test
        ports:
          - 5432:5432
```

Integration tests connect to the service container instead of spinning their own. This is faster and avoids Docker-in-Docker.

## Test Data Strategy

- **Seed data** (`packages/data/src/seed-data.ts`): shared, deterministic dataset used by mock, stub, and integration tests
- **Integration setup**: seed fixed reference rows (users, projects, seasons), then each test creates+cleans its own mission/quest item data
- **Isolation**: each `describe` block gets a transaction; rollback after the block (if supported) or truncate tables between tests
- **Failures**: assert typed/known errors at repository boundaries and preserve the original database error as the cause; never catch an error without asserting or rethrowing it

## Writing Integration Tests

### Naming Convention

- File: `*.integration.test.ts` (co-located with the driver under test)
- Tag: `describe("prisma integration", () => { ... })`

### Pattern

```ts
describe("prisma integration", () => {
  let container: PostgreSqlContainer;
  let client: ZipformDataClient;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:17-alpine")
      .withDatabase("zipform_test")
      .start();
    process.env.DATABASE_URL = container.getConnectionUri();
    process.env.DIRECT_URL = container.getConnectionUri();
    // Run migrations, seed reference data
    client = createPrismaDataClient();
  }, 30_000);

  afterAll(async () => {
    await container.stop();
  });

  it("persists and retrieves a mission", async () => {
    const created = await client.tloz.createMission({ ... });
    const detail = await client.tloz.getMissionDetail(created.id);
    expect(detail).toMatchObject({ id: created.id, title: created.title });
  });
});
```

## Rolling Out

| Step | What | When |
|------|------|------|
| 1 | Keep `pnpm check` database-independent with the mock driver | ✅ Done |
| 2 | Create `prisma.integration.test.ts` with testcontainers setup | ✅ Done |
| 3 | Add a `test:integration` script to package.json | ✅ Done |
| 4 | Add PostgreSQL service to CI workflow | Pending |
| 5 | Convert 2 key read tests + 3 mutation tests | ✅ Done |
| 6 | Expand to cover concurrency, FK errors, transactions | Ongoing |
| 7 | Add e2e tests with Playwright | Post-1.0 |
