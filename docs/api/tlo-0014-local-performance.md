# TLO-0014: verificación local de rendimiento

Fecha: 2026-08-08

## Alcance

La medición se ejecutó únicamente contra `127.0.0.1:3100`, con el driver mock y una clave local. No se enviaron cargas a producción. Cada endpoint tuvo una solicitud de calentamiento antes de registrar 30 muestras con concurrencia 8.

Comando base:

```bash
API_LOAD_SAMPLES=30 API_LOAD_CONCURRENCY=8 pnpm perf:api http://127.0.0.1:3100
```

## Comparación con el mismo workload

El baseline corresponde a `main` (`47bb523`) y el resultado posterior a `perf/tlo-0014-bounded-pagination` (`90a38fa`). Ambos usaron los mismos seis endpoints, parámetros, dataset mock, muestras y concurrencia.

| Endpoint | p95 baseline (ms) | p95 posterior (ms) | Bytes baseline | Bytes posteriores | Errores |
| --- | ---: | ---: | ---: | ---: | ---: |
| OpenAPI | 58.33 | 52.84 | 2,352,690 | 2,357,010 | 0 |
| Usuario actual | 23.94 | 29.15 | 4,590 | 4,590 | 0 |
| Projects (`limit=100`) | 30.35 | 28.00 | 31,470 | 31,470 | 0 |
| Missions (`limit=100`) | 26.44 | 31.58 | 566,460 | 566,460 | 0 |
| Missions por Project (`limit=100`) | 25.75 | 32.34 | 238,230 | 238,230 | 0 |
| Detail de Mission | 30.66 | 42.01 | 112,620 | 112,620 | 0 |

El resultado de latencia es inconcluso: la ejecución local de desarrollo muestra variación en ambos sentidos y no representa el costo de Prisma/Supabase. El resultado verificable del workload comparable es que no hubo errores ni crecimiento de payload en las colecciones; la diferencia de OpenAPI proviene de la documentación añadida.

## Workload paginado posterior

La versión ampliada de `scripts/api-load-test.mjs` verificó 16 escenarios con 10 muestras y concurrencia 4:

- primera página de Projects, Missions, Inventory, Resources, Containers, Contents y Documents;
- segunda página cuando existe `nextCursor` para Projects, Missions, Inventory y Resources;
- filtro combinado de Missions por Project, detail individual y batch de Missions;
- OpenAPI y usuario actual.

Todos los escenarios terminaron con 0 errores. Las primeras páginas acotadas tuvieron los siguientes p95: Projects 15.34 ms, Missions 14.99 ms, Inventory 20.92 ms, Resources 17.86 ms, Containers 26.05 ms, Contents 14.55 ms y Documents 38.93 ms. Las segundas páginas también terminaron sin errores.

## Interpretación

La evidencia principal de reducción de egress es estructural: las colecciones internas recorren páginas acotadas en lugar de depender de un `limit=100`, los endpoints rechazan límites y cursores inválidos, y los índices acompañan los filtros y el orden estable. El objetivo mensual de 3 GB debe verificarse con telemetría de Supabase durante siete días después del despliegue; este benchmark local no sustituye esa observación.
