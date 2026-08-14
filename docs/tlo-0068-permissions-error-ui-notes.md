# TLO-0068: permisos y errores de autorización en la UI

## Entregado

- El layout serializa un mapa de capacidades calculado en servidor desde la matriz de autorización.
- El cliente no vuelve a decidir roles: usa `canCreate`, `canUpdate`, `canMove`, `canDelete`, `canManageRoles` y `canManageAgents`.
- Las acciones de creación desaparecen para lectores, la sección de API keys queda reservada a Platform Owner y el estado del control no deja separadores vacíos.
- Los errores tipados `UNAUTHORIZED`, `FORBIDDEN`, `INVALID_REQUEST`, `LAST_OWNER` y `CONFLICT` producen mensajes funcionales para toasts.

## Verificación

- Tests focalizados: 42/42 verdes.
- Build Next.js con driver mock: correcto.
- `git diff --check`: correcto.

## Pendiente

- Verificar manualmente en preview con sesiones reales de Platform Owner, `agent:operative` y `agent:reader`.
- Confirmar si la UI de roles debe incorporarse a Settings o permanecer en el flujo administrativo existente.
- Ejecutar Playwright visual cuando el navegador Chromium esté disponible en el entorno.

No se modificaron migraciones, secretos ni datos de producción.
