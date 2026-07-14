<!--
PR title: write it in English using Conventional Commits style.
PR description: write it in Spanish. Remove comments and sections that do not apply.
Keep claims evidence-based; do not mark work complete before verification.
-->

## Resumen

<!-- Qué resultado entrega este PR y por qué es necesario. -->

## Misión TLOZ

- Mission: `TLO-____` / No aplica
- Project: `__________` / No aplica
- Estado de criterios: <!-- pendientes, actualizados y verificados mediante API -->
- Resource del PR: <!-- título y URL, si aplica -->

## Cambios

<!-- Agrupa por comportamiento o subsistema; evita un inventario archivo por archivo. -->

- <!-- cambio -->

## Contratos, datos y migraciones

- API o tipos públicos: <!-- Sin cambios / descripción -->
- Migración: <!-- No / ruta y propósito -->
- Orden de despliegue: <!-- No aplica / migrar antes de desplegar / otro -->
- Compatibilidad o rollback: <!-- Riesgos y estrategia -->

## Verificación

### Automatizada

<!-- Incluye comandos ejecutados y resultados reales. -->

- [ ] Typecheck
- [ ] Tests
- [ ] Build
- [ ] `git diff --check`

### Manual

<!-- Incluye solo escenarios relevantes: desktop, mobile, API, permisos, movimiento reducido, etc. -->

- <!-- escenario y resultado -->

## Riesgos y pendientes

<!-- Declara deuda, follow-ups, decisiones diferidas o escribe “Sin pendientes conocidos”. -->

- <!-- riesgo o pendiente -->

## Checklist del agente

- [ ] El PR apunta a `main` y no se hicieron commits directos a `main`.
- [ ] Los commits son atómicos, convencionales y no incluyen trabajo ajeno.
- [ ] Las funcionalidades nuevas tienen pruebas automatizadas cuando corresponde.
- [ ] No se añadieron secretos, planes temporales, artefactos locales ni dependencias redundantes.
- [ ] Las migraciones nuevas se conservaron y se verificó su orden de despliegue.
- [ ] La descripción refleja el estado real del PR y los pasos manuales relevantes.
- [ ] CI y preview finalizaron correctamente antes de cerrar la misión relacionada.
- [ ] Si aplica TLOZ: los cambios se hicieron por Zipform Data API, se verificaron con GET y el PR quedó adjunto como Resource.
