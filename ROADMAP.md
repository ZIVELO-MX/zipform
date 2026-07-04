# Zipform Roadmap

**Current Version:** 1.1.0
**Target Version:** 1.2.0

---

### ✅ DONE (1.0.0)

#### Platform

- [x] Dashboard shell with responsive sidebar
- [x] Mock data modules replaceable by real DB driver
- [x] ROADMAP.md and README documentation
- [x] Sidebar UserAvatar circle
- [x] Shared dashboard primitives
- [x] Release 1.0.0 tag on main (`v1.0.0`)
- [x] AGENTS.md: Git, PR, and branch workflow rules
- [x] Vercel deployment pipeline (`vercel.json`, build config, env vars)

#### TLOZ

- [x] Dashboard, Board, Lista, Tabla, Calendario, Mission Detail views
- [x] Card UI: shadcn Progress, type-colored border, Lucide icons, owner Avatar
- [x] Visual consistency across all views
- [x] Avatars as circles, solid black progress bars
- [x] Icon + type + flow badges in card header
- [x] Owner Avatar from UserProfile (avatarUrl, username)
- [x] Offset accent border, tooltips
- [x] Badge color matches mission type tone
- [x] QuestItemDots: hidden when empty, +N overflow
- [x] Integration tests against real PostgreSQL
- [x] Slug/key and displayId safe under concurrency
- [x] Multi-step updates in transactions
- [x] Eliminate build-time database coupling from `/tloz`
- [x] Show `blocked` in Tabla, include `completed` in Lista
- [x] `blocked` as real Board column
- [x] Protect 20+ Server Actions with `auth()`

#### Database & Auth

- [x] Prisma migrated from SQLite to PostgreSQL. Clean baseline `20260703150000_init_pg` on Supabase
- [x] Pooled (`DATABASE_URL`) + direct (`DIRECT_URL`) connection configured
- [x] `prisma migrate deploy` via `db:migrate:deploy` and `db:deploy`
- [x] Idempotent seed (deleteMany + createMany in transaction)
- [x] Credentials login with NextAuth v5. Login page, middleware, session management
- [x] Document env vars, pooled vs direct connection, seed policy, deployment runbook

#### CI/CD

- [x] GitHub Actions for CI
- [x] Vercel Git integration for deploy

---

### 1.1.0 — En curso

#### Quotes

- [ ] [DATA] Migrar tipos, driver, Server Actions y UI del módulo Quotes al monorepo
- [ ] [UI] Portar componentes de UI de Quotes

#### Data API

- [ ] [API][DOCS] Endpoints `/api/v1/users` y `/api/v1/projects` (OpenAPI spec + Route Handlers)
- [ ] [API][AUTH] Autenticar cada request con sesión NextAuth existente
- [ ] [API][UI] Swagger UI en `/api-docs` con sesión autenticada

#### TLOZ

- [ ] [PERFORMANCE] Scoped queries, filtros en DB, paginación
- [ ] [DATA] Kano classification
- [ ] [UX] Episode selector, crear/editar Mission, Inventory page, Project detail
- [ ] [SEARCH] Búsqueda global
- [ ] [UX] Slide-over con optimistic mutations, drag-and-drop
- [ ] [ARCHITECTURE] Dividir mission-views, separar navegación, sidebar colapsable
- [ ] [TESTS] Server Actions, optimistic updates, loading/error states
- [ ] [DX] ESLint CLI no interactivo

#### Platform

- [ ] [ZOHO] Configurar OAuth login con Zoho
- [ ] [ZOHO] Login page con opción Zoho, callback, sesión unificada

---

### LATER

- Finance, Security, UI Preview apps
- TLOZ: episodes, resources, quest items deeper management

---

Release 1.0.0 established TLOZ, authentication, PostgreSQL persistence, and Vercel production deployment. **1.1.0** adds the Data API contract, Zoho SSO, and Quotes migration. TLOZ has its own detailed roadmap in `imports/tloz/ROADMAP.md`.
