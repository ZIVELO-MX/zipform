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
- [ ] [API][WRITE] Incorporar endpoints autenticados para crear proyectos y missions, incluyendo carga atómica de checklists, recursos y dependencias. Actualmente la API v1 es de solo lectura y estas operaciones requieren Server Actions o acceso directo al repositorio de datos.

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

- [ ] [ZOHO] Configurar OAuth login con Zoho (redirect URI, Zoho API Console)
- [ ] [ZOHO] Login page con opción Zoho, callback, sesión unificada
- [ ] [SETTINGS] Implementar página de configuración de usuario: perfil, preferencias de vista, tema
- [ ] [SETTINGS] Persistir preferencias en `localStorage` bajo clave `zipform-`
- [ ] [SETTINGS] Agregar skeleton/shimmer loading states en sección Seguridad para elementos que cargan (agentes, API keys)
- [ ] [SETTINGS] El popover de copiar API key debe mostrarse centrado (no arriba del botón) y cerrarse solo al presionar "Cerrar"
- [ ] [SETTINGS] Todos los botones de copiar deben cambiar a "Copiado" con palomita (✓) al presionarlos

#### Avatar Profile Photos

- [x] [DB] Crear tabla `avatars` (id, name, imageUrl) y agregar UNIQUE constraint en `users.username`
- [x] [STORAGE] Bucket `PFP` creado en Supabase Storage con imágenes de Semielfo, Dragon y ZIBOT
- [x] [DATA] Agregar tipo `Avatar`, método `listAvatars()` al data client
- [x] [SETTINGS] Refactorizar avatar picker: reemplazar emojis hardcodeados con grid de imágenes desde la tabla `avatars`
- [x] [UI] Eliminar lógica emoji-first en `UserAvatar` del sidebar — usar siempre `<AvatarImage>` con iniciales de fallback
- [x] [DB] Seed de avatares default con URLs a Supabase Storage

#### Mobile — Prioridades Kano

La priorización sigue la clasificación Kano de `PRIORIDADES_KANO.md`. El objetivo es que **los recursos sean visibles en móvil** sin necesidad de soportar todas las vistas de escritorio.

##### Must-have (Básicos)

- [x] [MOBILE][NAV] Menú lateral (`MobileMenuPanel`) accesible desde el hamburger
- [x] [MOBILE][NAV] Navegación simplificada sin bottom nav (solo hamburger)
- [x] [MOBILE][READ] Dashboard responsivo: métricas, lista de misiones, secciones colapsables
- [x] [MOBILE][READ] Vista Lista responsiva: cards apiladas con información esencial
- [x] [MOBILE][READ] Detalle de Mission adaptado: propiedades, dependencias, Inventory relacionado
- [x] [MOBILE][READ] Vista Inventory responsiva con datos del item
- [x] [MOBILE][READ] Vista Project Detail responsiva: hero + lista de misiones filtrada
- [x] [MOBILE][READ] Vista Tabla responsiva con scroll horizontal
- [x] [MOBILE][LOAD] Estados de carga y error en todas las vistas móviles

##### Performance (Easy Wins)

Son refactors acotados que desbloquean el mayor valor con el menor esfuerzo.

- [x] [MOBILE][EASY] Header superior fijo con hamburguesa + título + breadcrumb truncado
- [x] [MOBILE][EASY] Búsqueda movida al sidebar, sin atajo ⌘K
- [x] [MOBILE][EASY] Crear entidades en pantalla completa (`/tloz/new`)
- [x] [MOBILE][EASY] Detalle de misión navega a página completa en móvil
- [x] [MOBILE][EASY] Solo vistas Lista y Tabla disponibles en móvil
- [x] [MOBILE][EASY] Tarjetas de misión responsivas: layout vertical, badges compactos, tooltips táctiles
- [x] [MOBILE][EASY] Sidebar colapsable automático en móvil con persistencia
- [x] [MOBILE][EASY] Breadcrumb responsivo: truncar niveles intermedios en móvil
- [x] [MOBILE][EASY] Filtros básicos: selector de proyecto y estado adaptado a viewport angosto

##### Delighter (Futuro)

- [ ] [MOBILE] Vista Board adaptada: columnas en scroll horizontal
- [ ] [MOBILE] Vista Tabla responsiva con columnas prioritarias
- [ ] [MOBILE] Drag-and-drop táctil en Board
- [ ] [MOBILE] SlideOver y transiciones animadas

---

### LATER

- Finance, Security, UI Preview apps
- TLOZ: episodes, resources, quest items deeper management

---

Release 1.0.0 established TLOZ, authentication, PostgreSQL persistence, and Vercel production deployment. **1.1.0** adds the Data API contract, Zoho SSO, Quotes migration, mobile responsiveness, and user settings. TLOZ has its own detailed roadmap in `imports/tloz/ROADMAP.md`.
