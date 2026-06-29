# ARQUITECTURA — /tloz

## Principio rector: código reusable va en packages/

```
packages/
├── types/       → Contratos puros (interfaces, tipos, uniones)
├── data/        → Lógica de datos (drivers mock/prisma, hidratación, seed)
└── ui/          → Componentes de diseño (Radix, tokens, primitives)

apps/
└── dashboard/
    ├── lib/tloz-data.ts   → Thin re-export wrapper (solo delega a @zipform/data)
    └── app/tloz/          → Páginas (server) + client components de layout
```

**Regla**: si un componente, tipo, o lógica puede ser usado desde otra app o desde
otra vista, va en `packages/`. Las páginas en `apps/dashboard/app/tloz/` solo
coordinan: importan datos desde `@zipform/data` y renderizan componentes.

## Vista general

El módulo TLOZ sigue el patrón **Server Component fetch → Client Component render**.
Los datos fluyen unidireccionalmente desde la base de datos hasta los componentes de UI.

```
@zipform/types  (contratos puros — interfaces, tipos, uniones)
       ↓
@zipform/data   (capa de datos — drivers mock/prisma + hidratación)
       ↓
lib/tloz-data.ts  (thin re-export wrapper, solo delega)
       ↓
page.tsx (server) → client.tsx → components/tloz/mission-views.tsx
```

## Estructura de archivos

```
apps/dashboard/app/tloz/
├── ARQUITECTURE.md
├── page.tsx                     (server) Dashboard principal
│   └── dashboard-client.tsx     (client) Recibe TlozDashboardSummary
├── board/page.tsx               (server) Vista Kanban
│   └── board/board-client.tsx   (client)
├── calendar/page.tsx            (server) Vista calendario
│   └── calendar/calendar-client.tsx
├── list/page.tsx                (server) Vista lista agrupada
│   └── list/list-client.tsx
├── table/page.tsx               (server) Vista tabla
│   └── table/table-client.tsx
└── missions/[missionId]/
    └── page.tsx                 (server) Detalle de misión
```

Cada vista tiene un **page.tsx** (server) que obtiene datos desde `@zipform/data`
y un **client.tsx** que recibe props y delega el render a
`components/tloz/mission-views.tsx`.

### ¿Por qué cada vista tiene su propio page.tsx + client.tsx?

- **page.tsx** es server component → puede ser async, importa data layer directamente
- **client.tsx** es el punto de entrada cliente mínimo; todo el render pesado está en
  `components/tloz/mission-views.tsx`
- Esta separación permite que cada ruta tenga su propio `loading.tsx` y `error.tsx`
  sin afectar las otras vistas

## Contratos principales

| Tipo | Definido en | Responsabilidad |
|---|---|---|
| `TlozMission`, `TlozSeason`, etc. | `@zipform/types` | Tipos puros del dominio |
| `TlozDashboardSummary` | `@zipform/data` | Agregado del dashboard (missions agrupadas, projects con counts, activity, quest items) |
| `TlozMissionRecord` | `@zipform/data` | Misión con relaciones resueltas (project, season, episode, dependencies, quest items, owner) |
| `TlozMissionDetail` | `@zipform/data` | TlozMissionRecord + checklist + resources |

## Drivers de datos

El driver se selecciona via `ZIPFORM_DATA_DRIVER` (env var):

- **`mock`** — datos en memoria desde `seed-data.ts`. Sin dependencias externas.
  Útil para desarrollo y tests.
- **`prisma`** — SQLite via Prisma. Requiere `db:migrate` + `db:seed`.

Ambos drivers implementan el mismo `TlozRepository` interface (`@zipform/data/src/contracts.ts`)
y comparten la lógica de hidratación en `tloz-hydration.ts`.

```
createDataClient()
  ├── ZIPFORM_DATA_DRIVER=mock    → createMockDataClient()
  └── ZIPFORM_DATA_DRIVER=prisma  → createPrismaDataClient()
                                       ↓
                               Exporta singleton: dataClient
```

## Data flow detallado

```
DB (SQLite)          Seed data (memoria)
      ↓                      ↓
  Prisma driver       Mock driver
      ↓                      ↓
      └────→ TlozRepository ←──┘
                    ↓
         buildTlozDashboardSummary()
         hydrateMissions()
         buildTlozMissionDetail()
                    ↓
              dataClient.tloz.*
                    ↓
          lib/tloz-data.ts (delega)
                    ↓
            page.tsx (server)
                    ↓
          client.tsx (props)
                    ↓
        mission-views.tsx (render)
```

## Estado actual

- ✅ Arquitectura driver-based con inyección por env var
- ✅ Hidratación separada de drivers (`tloz-hydration.ts`)
- ✅ Server components puros — client components solo renderizan
- ✅ Contratos tipados compartidos via `@zipform/types` y `@zipform/data`
- ❌ **Sin tests** (0% coverage en todo el proyecto)
- ❌ Sin operaciones de escritura (read-only; botones "Nueva Mission" deshabilitados)
- ❌ Filtros UI presentes (project/season/episode selects) pero no conectados
- ❌ Sin manejo de errores graceful ni loading states (`error.tsx`, `loading.tsx`)
- ❌ Búsqueda y drag-and-drop en Board sin implementar

## Roadmap

1. **CRUD en TlozRepository** — `createMission`, `updateMission`, `patchMissionStatus`,
   `deleteMission` en ambos drivers. Desbloquea botones y drag-and-drop.
2. **Tests** — Unitarios de `tloz-hydration.ts` → mock driver → prisma driver
   (SQLite en memoria). Mínimo aceptable: >70% coverage en `@zipform/data/src/`.
3. **Server Actions** — Mutaciones del lado del cliente con `useOptimistic` para
   feedback instantáneo.
4. **Filtros** — Conectar selects de proyecto/season/episodio al data fetching en
   server components via search params.
5. **UX** — `loading.tsx` por ruta, `error.tsx` con fallback, Suspense boundaries
   en secciones del dashboard.
