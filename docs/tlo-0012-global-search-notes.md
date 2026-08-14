# TLO-0012: búsqueda global y navegación documental

## Entregado

- El comando global consulta `GET /api/v1/search` después de dos caracteres y espera 180 ms antes de solicitar resultados.
- La API busca documentos canónicos y recursos por título o URL, aplica límites server-side y conserva cursores compuestos.
- Cada resultado devuelve tipo, título, contexto y destino canónico. Los recursos solo se muestran cuando se puede resolver su documento propietario.
- La paleta conserva navegación rápida, soporta `Escape`, flechas, `Enter`, foco visible y una acción de búsqueda en móvil.
- Se documentó el contrato en `docs/api/openapi.yaml` y `docs/api/README.md`.

## Verificación

- Tests focalizados: 6/6 verdes para cursor, permisos de ruta, contexto de recursos y destinos.
- Suite del dashboard: 313 pruebas verdes y 23 omitidas; los seis archivos `.mjs` que Vitest intenta recoger pertenecen a la suite Node del workspace y no contienen suites Vitest.
- Suite de datos focalizada: 34/34 verdes.
- Build de Next.js: correcto con el driver mock local.
- Smoke HTTP local autenticado: `GET /api/v1/search?q=mission` devolvió `200` con `{ data, nextCursor }`.
- React Doctor global del workspace: 37/100 por deuda preexistente (acciones server sin guard, `next-auth` beta y advertencias de componentes existentes). No se alteraron esas áreas ajenas a TLO-0012.

## Pendiente de cliente / despliegue

- Ejecutar la prueba visual Playwright en preview o producción con una cuenta autorizada y datos documentales reales. El conector de navegador integrado no estuvo disponible en esta sesión y el driver mock no contiene resultados canónicos visibles.
- Confirmar con el cliente si los recursos sin documento propietario deben ocultarse (comportamiento actual) o enviarse a una vista de recursos dedicada.
- Confirmar si el orden preferido debe mezclar documentos y recursos por relevancia o conservar documentos antes que recursos (comportamiento actual).

No se modificó ninguna migración ni se ejecutó una operación de escritura sobre la base de datos.
