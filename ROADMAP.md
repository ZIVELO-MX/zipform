# Zipform Roadmap

**Current Version:** 0.1
**Target Version:** 1.0

---

### NOW

- [PLATFORM] Build functional dashboard shell with responsive sidebar
- [PLATFORM] Create mock data modules that can be replaced by a real DB driver
- [DOCUMENTATION] Create ROADMAP.md and keep README synchronized
- [TLOZ] Ship initial dashboard module with Dashboard, Board, Lista, Tabla, Calendario, and Mission Detail views
- [TLOZ] Card UI: shadcn Progress bar, type-colored right border, Lucide icon per mission, owner Avatar + username footer
- [TLOZ] Visual consistency: icon + tone across all views (list, table, board, calendar, dashboard)
- [TLOZ] Avatars as circles, progress bar solid black
- [TLOZ] Icon + type + flow badges aligned horizontally in card header
- [TLOZ] Owner Avatar uses real UserProfile (avatarUrl, username) from mock data layer
- [TLOZ] Offset accent border (box-shadow) for card depth
- [TLOZ] Tooltips on state icons, dependencies, quest items
- [TLOZ] Badge color matches mission type tone on all views
- [TLOZ] QuestItemDots: hidden when empty, overflow count (+N) when >3
- [UI] Sidebar UserAvatar changed to circle (rounded-full) globally
- [UI] Shared dashboard primitives extracted for TLOZ cards, view sections, slide-over drawers, and attachment metadata

Status:

- Dashboard shell is functional in `apps/dashboard`.
- TLOZ now has an implemented mock-backed module under `/tloz`.
- TLOZ data still comes from replaceable async mock repositories.
- Cards, list rows, and table rows use consistent icon + type-tone visuals.
- Exploration Quest displays as **Explore** instead of "Exploration Quest".
- `DashboardMissionList` extracted from page into components layer, respecting `docs/ui-guidelines.md`.
- Owner display uses `UserProfile` with avatar image, username, and initials fallback.
- All user avatars (sidebar + TLOZ) are circles.
- Mission type badges use the same color as the right border accent.
- TLOZ now uses shared UI primitives for dashboard presentation, slide-over panels, and attachment/resource rows.
- Mission Detail reads persisted `TlozMission.startDate` and `TlozProject.color`; the database audit confirmed both already exist in Prisma and the current migration, so no duplicate columns are required.
- Episode and Kano are hidden from Mission properties until their deferred data/UX work below is completed.

---

### NEXT

**Authentication**

- [AUTH] Enable shared internal authentication

**Quotes**

- [QUOTES] Prepare Quotes integration path for daily-use readiness
  Depends on: Enable shared internal authentication

**TLOZ**

- [TLOZ] Replace mock repositories with persistence, permissions, and global search
  Depends on: Enable shared internal authentication
- [TLOZ] Define creation and editing behavior for Missions, checklist items, resources, dependencies, and Quest Items
- [TLOZ] Resolve activity semantics for Mission Detail

**TLOZ hardening — pendientes auditados**

P0 — bloqueantes antes de habilitar escritura en producción:

- [TLOZ][SECURITY] Proteger Server Actions con autenticación, autorización por operación y validación runtime de IDs y payloads
  Depends on: Enable shared internal authentication
- [TLOZ][CORRECTNESS] Representar `blocked` como columna real del Board para que una Mission no desaparezca al cambiar de estado

P1 — confiabilidad y escalabilidad:

- [TLOZ][CORRECTNESS] Mostrar `blocked` correctamente en Tabla e incluir `completed` en Lista
- [TLOZ][TESTS] Añadir integración del driver Prisma contra SQLite real; los tests actuales usan un stub de Prisma
- [TLOZ][TESTS] Cubrir Server Actions, filtros, actualización optimista, rollback y estados loading/error
- [TLOZ][DX] Migrar `next lint` a ESLint CLI y restaurar un comando de lint no interactivo
- [TLOZ][PERFORMANCE] Aplicar filtros y paginación en Prisma, evitando cargar e hidratar el grafo TLOZ completo en cada listado

P2 — completar experiencia de producto:

- [TLOZ][DATA] Definir y persistir clasificación Kano antes de volver a mostrarla; no inferir `Basic` desde el tipo de Mission
- [TLOZ][UX] Volver a mostrar Episode en propiedades cuando el selector Project → Season → Episode y sus estados vacíos estén cerrados
- [TLOZ][UX] Conectar los flujos visibles de crear, editar y eliminar Mission al CRUD ya disponible
- [TLOZ][SEARCH] Implementar búsqueda global sobre Missions, Projects, Quest Items y Resources
- [TLOZ][UX] Sincronizar el Mission slide-over con mutaciones optimistas y añadir loading boundaries específicos por vista
- [TLOZ][BOARD] Implementar drag-and-drop accesible o retirar el atributo `draggable` hasta que exista comportamiento real
- [TLOZ][ARCHITECTURE] Dividir `mission-views.tsx` por vista y consolidar configuración compartida de estados
- [TLOZ][DOCS] Sincronizar `apps/dashboard/app/tloz/ARQUITECTURE.md` con CRUD, filtros, tests y estados UX ya implementados

**UI**

- [UI] Continue hardening shared primitives used by TLOZ and platform pages
- [UI] Revisit the internal Attachment primitive when an official shadcn registry item is available

**Infrastructure**

- [PLATFORM] Prepare the dashboard deployment baseline

---

### LATER

- Add Finance as an internal platform application
- Add Security as an internal platform application
- Add UI Preview for shared component validation
- Expand TLOZ beyond Missions into deeper project, episode, resource, and Quest Item management after persistence and permissions exist

---

Moving from 0.1 to 1.0 requires Quotes and TLOZ to both reach daily usability.
TLOZ now has its own implementation roadmap in `imports/tloz/ROADMAP.md`.
The platform roadmap tracks the shared foundations and integration gates, while
the TLOZ roadmap tracks product-specific behavior and unresolved decisions.
