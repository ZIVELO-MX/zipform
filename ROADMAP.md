# Zipform Roadmap

**Current Version:** 0.1
**Target Version:** 1.0

---

### ✅ DONE

- [x] [PLATFORM] Dashboard shell with responsive sidebar
- [x] [PLATFORM] Mock data modules replaceable by real DB driver
- [x] [DOCUMENTATION] ROADMAP.md and README
- [x] [TLOZ] Dashboard, Board, Lista, Tabla, Calendario, Mission Detail views
- [x] [TLOZ] Card UI with shadcn Progress, type-colored border, Lucide icons, owner Avatar
- [x] [TLOZ] Visual consistency across all views
- [x] [TLOZ] Avatars as circles, solid black progress bars
- [x] [TLOZ] Icon + type + flow badges in card header
- [x] [TLOZ] Owner Avatar from UserProfile (avatarUrl, username)
- [x] [TLOZ] Offset accent border, tooltips
- [x] [TLOZ] Badge color matches mission type tone
- [x] [TLOZ] QuestItemDots: hidden when empty, +N overflow
- [x] [UI] Sidebar UserAvatar circle
- [x] [UI] Shared dashboard primitives
- [x] [DATA][DATABASE] Prisma migrated from SQLite to PostgreSQL. Clean baseline `20260703150000_init_pg` on Supabase.
- [x] [DATA][DATABASE] Pooled (`DATABASE_URL`) + direct (`DIRECT_URL`) connection configured
- [x] [DATA][DEPLOYMENT] `prisma migrate deploy` via `db:migrate:deploy` and `db:deploy`
- [x] [DATA][SEED] Idempotent seed (deleteMany + createMany in transaction)
- [x] [AUTH] Credentials login with NextAuth v5. Login page, middleware, session management

**Status:** Dashboard, TLOZ views, and auth funcionan. TLOZ usa Prisma contra PostgreSQL por defecto (driver mock aún disponible con `ZIPFORM_DATA_DRIVER=mock`). Quotes es placeholder.

---

### P0 — BLOQUEANTES PARA RELEASE 1.0.0

**Security — Server Actions sin protección**

- [ ] [TLOZ][SECURITY] Proteger las 20+ Server Actions en `apps/dashboard/app/tloz/actions.ts` con autenticación (`auth()`) y autorización por operación. Actualmente cualquier request sin auth puede crear/editar/eliminar Missions, proyectos, quest items, etc.

**Deployment**

- [ ] [PLATFORM][DEPLOYMENT] Crear `vercel.json` con build command, output config, y env vars setup
- [ ] [PLATFORM][CI/CD] GitHub Actions para CI (lint, typecheck, test) y deploy

**Quotes**

- [ ] [QUOTES][DATA] Migrar tipos, driver, Server Actions y UI del módulo Quotes al monorepo
- [ ] [QUOTES][UI] Portar componentes de UI de Quotes

---

### P1 — RECOMENDADOS PRE-1.0.0

- [ ] [TLOZ][TESTS] Tests de integración Prisma contra PostgreSQL real
- [ ] [TLOZ][CORRECTNESS] Slug/lave y displayId seguros bajo concurrencia
- [ ] [TLOZ][CORRECTNESS] Multi-step updates en transacciones
- [ ] [TLOZ][DEPLOYMENT] Eliminar build-time database coupling de `/tloz`
- [ ] [TLOZ][CORRECTNESS] Mostrar `blocked` en Tabla, incluir `completed` en Lista
- [ ] [TLOZ][CORRECTNESS] `blocked` como columna real del Board
- [ ] [PLATFORM][DOCS] Documentar env vars, pooled vs direct connection, seed policy, deployment runbook

---

### P2 — POST-1.0.0

- [ ] [TLOZ][PERFORMANCE] Scoped queries, filtros en DB, paginación
- [ ] [TLOZ][DATA] Kano classification
- [ ] [TLOZ][UX] Episode selector, crear/editar Mission, Inventory page, Project detail
- [ ] [TLOZ][SEARCH] Búsqueda global
- [ ] [TLOZ][UX] Slide-over con optimistic mutations, drag-and-drop
- [ ] [TLOZ][ARCHITECTURE] Dividir mission-views, separar navegación, sidebar colapsable
- [ ] [TLOZ][TESTS] Server Actions, optimistic updates, loading/error states
- [ ] [TLOZ][DX] ESLint CLI no interactivo

---

### LATER

- Finance, Security, UI Preview apps
- TLOZ: episodes, resources, quest items deeper management

---

Moving from 0.1 to 1.0 requires TLOZ and Quotes to both reach daily usability. TLOZ has its own roadmap in `imports/tloz/ROADMAP.md`.
