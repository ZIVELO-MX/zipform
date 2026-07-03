# Auditoría de rendimiento React/Next.js

Fecha: 2026-07-02
Branch: `codex/react-playwright-audit`

## Alcance y método

Se revisaron las rutas App Router, los límites Server/Client Components, la carga de datos del módulo TLOZ y su ejecución en Chromium con `playwright-cli` a 1440 × 1000. La priorización sigue `vercel-react-best-practices` y la guía `modern-web-guidance` de rendimiento.

Línea base observada:

- `/tloz` renderiza correctamente y mantiene una jerarquía accesible de navegación y encabezados.
- La consola solo reporta un `404` de `favicon.ico`; una imagen externa de Pinterest es bloqueada por ORB.
- El cambio de vista se ejecuta en cliente y no navega, conforme a la arquitectura documentada.

## Hallazgos priorizados

### P0 — Todas las vistas entran en el bundle inicial

`tloz-view-renderer.tsx` importa estáticamente Dashboard, Board, List, Table y Calendar. Solo una vista se muestra, pero el navegador recibe código de todas, incluyendo `@dnd-kit/core` a través del Board y los componentes densos de detalle.

- Regla: `bundle-dynamic-imports` (impacto crítico).
- Cambio: conservar el Dashboard inicial con SSR y cargar Board, List, Table y Calendar con `next/dynamic`, mostrando un fallback estable durante cambios de vista. Esta separación evita alterar el orden de `useId` de los paneles SSR, que produjo un mismatch de hidratación al hacer dinámico también el Dashboard.
- Evidencia esperada: build con chunks independientes y navegación de las cinco vistas sin errores.

### P0 — Consultas idénticas no se deduplican por request

El layout obtiene proyectos y misiones. Las páginas TLOZ y `TlozPageShell` vuelven a solicitar los mismos datos dentro del mismo render. Estas lecturas no usan `fetch`, por lo que Next.js no las memoiza automáticamente.

- Regla: `server-cache-react` (impacto alto en esta arquitectura).
- Cambio: envolver lecturas puras de servidor con `React.cache()` y consumir esos wrappers también desde el layout.
- Evidencia esperada: una misma lectura con los mismos argumentos comparte resultado durante el request sin introducir caché entre usuarios o requests.

### P1 — El lobby solicita misiones dos veces en el mismo `Promise.all`

`app/tloz/page.tsx` llama dos veces a `getTlozMissions()` para poblar `missions` y `allMissions`, aunque ambos valores son idénticos.

- Regla: eliminar trabajo redundante antes de optimizaciones menores.
- Cambio: una sola lectura y reutilización de la referencia.

### P1 — Filtrado y orden recrean varias colecciones por render

`TlozViewRenderer` encadena cinco `filter()` y un `sort()` en cada render. Además, el dashboard vuelve a recorrer la colección para cada estado.

- Reglas: `js-combine-iterations` y `rerender-memo`.
- Cambio: calcular las misiones visibles en un único `useMemo`, con un solo recorrido y copia ordenada inmutable.
- Evidencia esperada: filtros, orden y checkbox de completadas conservan su comportamiento.

### P2 — Recursos de consola ajenos a la ruta crítica

Falta `favicon.ico` y una imagen remota de Pinterest es bloqueada por ORB. No bloquean la interacción principal, por lo que no deben desplazar las mejoras P0/P1. Se documentan para una iteración de higiene de assets.

## Plan de implementación

1. Añadir deduplicación por request a la capa `lib/tloz-data.ts` y al usuario actual.
2. Eliminar la consulta duplicada del lobby.
3. Separar los renderers no iniciales mediante imports dinámicos.
4. Consolidar filtrado/orden con memoización.
5. Ejecutar typecheck, build y un recorrido Playwright de Dashboard, Board, Lista, Tabla y Calendario en desktop y viewport móvil.

## Criterios de aceptación

- El branch compila sin errores de TypeScript ni de Next.js.
- `/tloz` carga sin errores de aplicación.
- Las cinco vistas cambian sin recarga completa y muestran contenido.
- Los filtros persistidos continúan resolviendo una vista compatible.
- El build demuestra separación de código sin convertir los renderers en componentes exclusivamente cliente sin SSR.

## Resultado de validación

- `pnpm build`: correcto. `/tloz` queda en 342 kB de First Load JS y el build genera chunks separados para las cuatro vistas diferidas.
- `playwright-cli`: Dashboard, Lista, Board, Tabla y Calendario renderizan su encabezado en la misma URL, sin recarga de ruta.
- Hidratación: sin mismatches después de conservar el Dashboard inicial como import estático SSR.
- Viewport móvil 390 × 844: Dashboard, navegación inferior y Control permanecen accesibles.
- Consola: sin errores de aplicación; permanece únicamente el `404` preexistente de `favicon.ico` documentado como P2.
- `pnpm typecheck`: correcto después de declarar `vitest` en los workspaces que contienen tests y extender el chequeo raíz a todos los paquetes.
