# Deployment & Operations

## Environment Variables

### Authentication

| Variable | Required | Description |
|---|---|---|
| `AUTH_SECRET` | Yes | NextAuth secret (generate with `openssl rand -base64 32`) |
| `ZOHO_CLIENT_ID` | For Zoho login | OAuth client ID |
| `ZOHO_CLIENT_SECRET` | For Zoho login | OAuth client secret |

### Database

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Pooled connection (PgBouncer transaction mode) for app runtime |
| `DIRECT_URL` | Yes | Direct session-mode connection for Prisma migrations |

### Data Driver

| Variable | Default | Description |
|---|---|---|
| `ZIPFORM_DATA_DRIVER` | `prisma` | Set to `mock` for in-memory data (dev/testing without a database) |

---

## Database Connection Model

Zipform uses a **pooled + direct** connection strategy required by Supabase:

```
┌─────────────────────────────────────────────────────┐
│  Application (Next.js)                              │
│                                                     │
│  DATABASE_URL ──────► PgBouncer (port 6543)         │
│    (transaction mode, connection pooling)           │
│                                                     │
│  DIRECT_URL ────────► PostgreSQL (port 5432)        │
│    (session mode, used by Prisma Migrate only)      │
└─────────────────────────────────────────────────────┘
```

- **`DATABASE_URL`**: Used at runtime by Prisma Client. Points to PgBouncer on port `6543` with `?pgbouncer=true`. This enables connection pooling for serverless/edge functions.
- **`DIRECT_URL`**: Used exclusively by `prisma migrate deploy` and `prisma db seed`. Bypasses PgBouncer and connects directly to PostgreSQL on port `5432`. Required because PgBouncer does not support prepared transactions or DDL.

### Connection URIs

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:password@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.PROJECT_REF:password@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
```

Replace `PROJECT_REF` with your Supabase project reference and `password` with the database password.

---

## Seed Policy

### Idempotent Seed

The seed script (`packages/data/prisma/seed.ts`) is **fully idempotent**:

1. Wipes all tables in dependency order inside a single `$transaction`
2. Inserts all seed data using `createMany` for bulk inserts
3. Creates a local session so the app auto-logs in as `benji` with password `changeme`

Run:
```bash
pnpm db:seed
```

### Seed Data Source

The canonical seed data lives in `packages/data/src/seed-data.ts`. Both the mock driver and the seed script consume this same module, so the in-memory and database behaviours are identical.

### Adding Seed Data

1. Add the new records to `packages/data/src/seed-data.ts`
2. Add the corresponding `createMany` call in `packages/data/prisma/seed.ts`
3. Run `pnpm db:seed` to apply

---

## Deployment Runbook

### Prerequisites

- Node.js 22
- pnpm (enable via `corepack enable`)
- Access to the Supabase project
- `DATABASE_URL` and `DIRECT_URL` configured in the deployment environment

### 1. Build

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm check
```

`pnpm check` runs:
1. Prisma client generation
2. TypeScript type checking for all packages
3. Unit tests with the mock driver
4. Production dashboard build

### 2. Database Migrations

```bash
pnpm db:migrate:deploy
```

This applies all pending migrations to the production database using `DIRECT_URL`.

For the 1.0.0 baseline only, reset TLOZ work data while preserving users and sessions:

```bash
CONFIRM_RELEASE_DATA_RESET=RESET_TLOZ_FOR_1_0 pnpm db:prepare-release-1
```

This command is transactional, removes existing TLOZ missions and related entities, and creates the four release projects. Do not replace it with `pnpm db:seed`, which also replaces users.

### 3. Deploy

Deploy the `apps/dashboard` Next.js application to Vercel:

```bash
cd apps/dashboard
vercel --prod
```

Or connect the GitHub repository to Vercel for automatic deployments.

For the Vercel project settings, use `apps/dashboard` as the Root Directory and enable access to source files outside the Root Directory so the dashboard can consume the shared workspace packages. The application-level `vercel.json` supplies the install, build, and output settings.

### 4. Post-Deployment Verification

- Confirm the dashboard loads and shows platform metrics
- Navigate to `/tloz` and verify TLOZ views load with seeded data
- Confirm authentication works (login page, session persistence)
- Check that mission CRUD operations work end-to-end

### Rollback

- **Database**: `prisma migrate deploy` is applied sequentially. To roll back, deploy the previous migration or restore from a database backup.
- **Application**: Vercel deployments are instantly reversible via the Vercel dashboard.
- Never force-push or rewrite git history.

---

## CI/CD

The repository includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs `pnpm check` on every push to `main` and on pull requests.

Deployments are managed by the Vercel Git integration. Pull requests receive Preview deployments and pushes to `main` deploy to Production. Vercel credentials are not stored in GitHub Actions because the Git integration authenticates deployments directly.

### Integration Tests

Integration tests require a real PostgreSQL instance. They are excluded from the default `pnpm test` run.

Run locally:
```bash
TEST_DATABASE_URL="postgresql://..." pnpm test:integration
```

To enable in CI, add a PostgreSQL service container and a matrix strategy:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    env:
      POSTGRES_USER: zipform
      POSTGRES_PASSWORD: zipform
      POSTGRES_DB: zipform_test
    ports:
      - 5432:5432

env:
  TEST_DATABASE_URL: "postgresql://zipform:zipform@localhost:5432/zipform_test"
```

---

## Local Development Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Apply migrations and seed
pnpm db:migrate:deploy
pnpm db:seed

# 4. Start the development server
cd apps/dashboard
pnpm dev

# 5. Run tests
pnpm test          # unit tests (no DB needed)
pnpm test:coverage # unit tests with coverage
```

### Using the Mock Driver

To develop without a database connection:

```bash
ZIPFORM_DATA_DRIVER=mock pnpm dev
```

The mock driver uses the same seed data and implements the same contract as the Prisma driver.
