# Pruebas locales de carga de la Data API

El benchmark es de solo lectura y usa datos mock. No apunta a producción ni a una base de datos real.

## Servidor local

```bash
pnpm api:local
# Después de `pnpm build`, para medir el runtime compilado:
pnpm api:local --production 3100
```

La API queda en `http://127.0.0.1:3100` y muestra una API key de desarrollo. Esa key solo funciona con `ZIPFORM_DATA_DRIVER=mock` fuera de producción.

## Benchmark

```bash
API_LOAD_SAMPLES=30 API_LOAD_CONCURRENCY=8 pnpm perf:api
```

Para comparar dos servidores con el mismo dataset:

```bash
pnpm perf:api --compare http://127.0.0.1:3101 http://127.0.0.1:3102
```

El informe incluye p50, p95, p99, throughput, bytes y errores para OpenAPI, usuario actual, proyectos, misiones, misiones filtradas y detalle de misión. El resultado es `improvement`, `regression` o `inconclusive`; es informativo y no bloquea CI porque el tiempo de un runner puede variar.

## Consultas de producción

```bash
pnpm tloz:api /api/v1/projects GET
# Mutación autorizada con payload preparado y revisado:
pnpm tloz:api /api/v1/missions/<id>/status PATCH --data-file /tmp/status.json
```

El wrapper fija `https://zipform.zivelo.dev`, toma `ZIPFORM_TOKEN` del entorno y no lo imprime. Úsalo para datos actuales y verificaciones de misiones; el servidor local no es evidencia de producción.
