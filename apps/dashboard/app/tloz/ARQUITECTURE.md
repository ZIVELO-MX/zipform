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

## Arquitectura de navegación y rutas

Las rutas descritas por producto son relativas a la raíz de TLOZ. En Zipform, la raíz
está montada en `/tloz`, por lo que `/inventory` en TLOZ corresponde a
`/tloz/inventory` en la aplicación completa.

| Contexto TLOZ | Ruta Zipform | Contexto |
|---|---|---|---|
| `/` | `/tloz` | Lobby global |
| `/:projectSlug` | `/tloz/:projectSlug` | Proyecto regular o de sistema |
| `/:projectSlug/:detailId` | `/tloz/:projectSlug/:detailId` | Detalle según la configuración del proyecto |

Los slugs regulares se derivan de forma determinista del nombre del proyecto.
`inventory` y `projects` son slugs reservados configurados en `SYSTEM_PROJECTS`; no
tienen carpetas de ruta propias. No existen rutas por tipo de vista.

### Sidebar y navegación contextual

El sidebar de TLOZ tiene una sola fuente de configuración:

- `Lobby` apunta a `/tloz`.
- `Sistema` contiene `Inventory` y `Projects`.
- `Proyectos` contiene las entradas dinámicas, con slug y contador de misiones activas.

> **Pendiente:** La entrada `Lobby` debería marcarse activa solo en `/tloz` exacto, no en rutas hijas. Requiere soporte de `exact` en `NavItem` de `@zipform/ui`.

### Contexto en rutas; presentación en estado UI

TLOZ sigue el modelo de Linear: una ruta responde únicamente **dónde está** el
usuario. El estado de interfaz responde **cómo lo está viendo**. Workspace y Global
son el mismo contexto, montado en `/tloz` dentro de Zipform.

Board, Lista, Tabla y Calendario no tienen `page.tsx`, rutas ni query params. Vista,
filtros, orden, agrupación y opciones de presentación viven en
`TlozViewStateProvider`, se aplican en cliente y se persisten en `localStorage`. El
workspace global y los proyectos comparten la preferencia de vista, así que abrir
Core desde un Board global mantiene Board sin convertir esa preferencia en URL. El
contenido se vuelve a acotar al proyecto resuelto por la ruta.

No se admiten parámetros `view`, `project`, `season`, `episode`, `owner`, orden o
agrupación en navegación. Las APIs de datos pueden aceptar filtros para otros
consumidores, pero la navegación TLOZ no los usa para representar estado visual.

### Breadcrumb y header compartido

La raíz no renderiza ningún breadcrumb: tampoco muestra `/` ni "Lobby". Los
breadcrumbs empiezan en el primer contexto significativo: `Inventory`, `Projects` o
el nombre del proyecto. Mission Detail muestra `Project / Mission` dentro de su
layout propio. El botón `←` se ha eliminado del header; la navegación se realiza
mediante los enlaces del sidebar y los breadcrumbs.

`TlozPageShell` compone un único header compartido con tres elementos:
breadcrumb, búsqueda global y `Control`. Lo usan Lobby global, Inventory,
Projects y Project Dashboard. El botón Control abre un popover que concentra las
opciones relevantes de vista, filtros, orden, agrupación y display; la vista se
elige mediante botones con icono en cuadrícula de 2 columnas y el header no
acumula toggles independientes. Mission Detail e Item Detail son
deliberadamente la única excepción: usan su layout de detalle porque no ofrecen
vistas intercambiables.

Inventory usa exactamente el mismo header y Control. Su configuración limita el
popover a `Tabla` y `Lista`; el adapter de dominio consume esa selección compartida
y no renderiza un header o toggle propio.

La preferencia persistida y la vista efectiva son conceptos distintos. Si la
preferencia global es Board, Dashboard o Calendario, un system project muestra
Tabla como fallback temporal sin escribir ese fallback en el estado compartido. Al
volver a un proyecto regular se recupera la preferencia original.

Mission, Inventory y Projects componen `EntityTable` y `EntityList`; no existen
tablas paralelas por dominio. Las filas abren el mismo `SlideOver` y los detalles
componen el shell de Mission Detail en modo panel o página completa. Cada dominio
solo configura propiedades y secciones: Inventory omite trabajo ejecutable y
Projects reemplaza dependencias por su lista de Missions.

Los inputs de detalle también son primitives compartidos: `DetailPropertyRow`,
`UserPicker`, `DatePicker`, `IconPicker`, `ColorPicker` y `Select`. Como el
`SlideOver` usa un dialog modal nativo, `OverlayPortalProvider` hace que popovers,
selects, tooltips y menús se monten dentro del dialog y participen en su top layer.
Las referencias a Inventory siempre conservan el ID (`/tloz/inventory/:itemId`):
desde una Mission abren primero el panel y desde allí permiten abrir la página
completa.

### Límites de datos por proyecto

Project Detail recibe misiones, usuarios e Inventory relacionado exclusivamente con
el proyecto resuelto por slug. Mission Detail valida que el `missionId` pertenezca al
proyecto de la URL; una combinación cruzada responde como no encontrada.

Las dependencias de misión son invariantes de dominio, no solo filtros visuales:

- el picker muestra únicamente misiones con el mismo `projectId`;
- los drivers mock y Prisma rechazan una relación sin proyecto o entre proyectos;
- cambiar una misión de proyecto elimina sus dependencias anteriores;
- la hidratación descarta relaciones históricas inválidas para que no se filtren a UI.

SQLite/Prisma no puede expresar esta igualdad entre dos filas mediante una clave
foránea simple. La restricción se aplica en el servicio de repositorio, que es la
única superficie de escritura de dependencias, y se cubre con tests de contrato.

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
├── page.tsx                         (server) Lobby global
├── [projectSlug]/page.tsx             (server) Proyecto regular o de sistema
├── [projectSlug]/[missionId]/page.tsx (server) Detalle regular o de sistema
└── tloz-view-renderer.tsx             (client) Renderer compartido de vistas
```

Cada contexto tiene un **page.tsx** server que obtiene su conjunto completo de datos.
`TlozViewRenderer` selecciona el componente visual en cliente desde el estado UI.
Los client components de Board, Lista, Tabla y Calendario son renderers, no rutas.
Esto evita navegación, refetch y entradas de historial al cambiar únicamente la
presentación.

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
- ✅ Tests de hidratación y contratos de drivers, incluida la restricción de dependencias por proyecto
- ✅ Vista compartida entre rutas (Control con selector de vista con iconos, persistido en localStorage)
- ✅ Sidebar con `Lobby` en lugar de `Missions` y entrada `Projects` con icono `FolderKanban`
- ✅ Owner display simplificado: solo avatar + username, sin nombre completo
- ✅ Dashboard de proyecto sin secciones `Projects` ni `Inventory`
- ✅ `Actividad reciente` con `EmptyState` cuando no hay items
- ✅ Borde izquierdo de `Mi foco` según el color del tipo de misión
- ✅ Badges de categoría, proyecto, estado y tipo con colores según sus datos
- ✅ Header sin botón `←` y breadcrumbs desde el primer contexto útil
- ✅ Checkbox "Mostrar completadas" consistente con el de mission detail
- ✅ Project Dashboard e Item Detail con páginas dedicadas
- ✅ `DashboardNowSection` respeta el límite 1 Quest + 1 Support
- ✅ Creación validada de missions, projects e inventory desde Lista, Tabla y Control
- ✅ Edición de Mission, Project e Inventory desde el mismo shell de detalle
- ✅ Filtros, orden y agrupación conectados al estado local de cada contexto
- ✅ URLs persistentes por `project.slug` y `mission.displayId` (`COR-0001`), no derivadas en render
- ✅ Relaciones con foreign keys e índices; recursos restringidos a un único propietario de dominio
- ❌ Sin manejo de errores graceful ni loading states (`error.tsx`, `loading.tsx`)
- ❌ Búsqueda y drag-and-drop en Board sin implementar
- ❌ Sidebar: `Lobby` se marca activo en cualquier ruta `/tloz/*` (falta `exact` en `NavItem` de `@zipform/ui`)

## Roadmap

1. **Tests** — Unitarios de `tloz-hydration.ts` → mock driver → prisma driver
   (SQLite en memoria). Mínimo aceptable: >70% coverage en `@zipform/data/src/`.
2. **Optimistic UI** — Mutaciones del lado del cliente con `useOptimistic` para
   feedback instantáneo.
3. **UX** — `loading.tsx` por ruta, `error.tsx` con fallback, Suspense boundaries
   en secciones del dashboard.
