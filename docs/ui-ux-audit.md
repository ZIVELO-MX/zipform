# Correcciones de UI/UX de Zipform

Fecha: 2026-09-05. Rama: `fix/frontend-ui-ux-polish`.

Se mantuvo la identidad de TLOZ: superficies claras, rojo Zivelo, controles compactos y componentes compartidos. Se aplicaron Impeccable, accesibilidad, mantenibilidad y buenas prácticas de React.

## Hallazgos corregidos

| Superficie | Problema | Cambio |
| --- | --- | --- |
| Shell | Entre 768 y 920 px, el contenido quedaba debajo de una barra lateral de pantalla completa. | Unificar el breakpoint de CSS y navegación en 768 px. |
| Dashboard | Columnas rígidas desbordaban el espacio disponible. | Ancho contenido y columnas adaptadas al ancho del workspace, incluso al redimensionar la barra. |
| Dashboard | “Solo yo” no tenía acción y el encabezado afirmaba un número fijo de personas. | Conectar el filtro al usuario actual y eliminar el dato fijo. |
| Tarjetas | Las tarjetas y filas del dashboard solo respondían al ratón. | Nombres accesibles, foco visible y activación con Enter/Espacio. |
| Navegación | El menú móvil oculto seguía expuesto al teclado y a lectores de pantalla. | Diálogo compartido con foco contenido, Escape y restitución del foco. Cerrar el menú al abrir configuración o pasar a escritorio. |
| Barra lateral | Preferencias bloqueadas podían provocar errores; el atajo interfería con edición de texto. | Recuperación ante storage bloqueado, persistencia después de cargar y protección de campos editables. Redimensionamiento por teclado. |
| Ventanas | Diálogos y popovers podían salir del viewport; algunos ignoraban movimiento reducido. | Límites por altura disponible, scroll interno y movimiento reducido. Nombre accesible para paneles. |
| Creación móvil | No había botón Guardar; se perdían proyecto y opciones de relaciones. | Acciones propias del formulario, scroll, contexto del proyecto y relaciones disponibles. |
| Guardado | Era posible enviar de nuevo o cerrar un panel mientras se guardaba. | Bloqueo del envío duplicado y del cierre durante la operación; errores inline y campos asociados a sus errores. |
| Búsqueda | El filtrado local descartaba coincidencias devueltas por el servidor; podían aparecer respuestas anteriores. | Respetar resultados del servidor, cancelar consultas anteriores y mostrar carga desde el debounce. |
| Detalles | Una carga fallida dejaba una misión cargando o un documento aparentando estar disponible. | Error explícito y Reintentar. La navegación entre misiones restaura contrato y capacidades al volver. |
| Configuración | Escape conservaba borradores descartados; el selector de avatar permanecía interactivo aunque estuviera oculto. | Reiniciar el borrador al reabrir y usar un diálogo anidado real. |
| Avatares | Una imagen no disponible dejaba un círculo vacío; el indicador de selección se recortaba. | Iniciales como alternativa, indicador visible y soporte para la URL actual del perfil. |
| Tema | Se ofrecía un selector que guardaba una preferencia sin aplicar ningún tema. | Retirar el selector inoperante. No se modifican ni borran las preferencias existentes. |
| API keys | El popover de éxito abría antes de crear la llave y podían mezclarse resultados de cuentas distintas. | Abrir solo con un resultado, cancelar respuestas obsoletas, mostrar carga/error y bloquear cambio de cuenta durante creación. |
| Login | Un fallo de conexión con Zoho dejaba controles bloqueados. | Capturar el error y liberar el estado de carga. |
| 404 | El enlace Roadmap conducía a otra ruta inexistente. | Navegación a Lobby/Projects y encabezado compacto en español. |

## Verificación reproducible

Desde la raíz:

```sh
pnpm install --frozen-lockfile
pnpm db:generate
pnpm --filter @tloz/dashboard exec playwright install chromium
pnpm --filter @tloz/dashboard test:e2e
```

Para usar Chrome instalado: `PLAYWRIGHT_CHANNEL=chrome pnpm --filter @tloz/dashboard test:e2e`.

La suite arranca su propio servidor en `127.0.0.1:3100`, usa el driver mock y crea los Containers necesarios mediante la API local. La sesión sintética y la llave local solo pertenecen a ese servidor de pruebas. No se cambian los proveedores de autenticación ni se necesitan credenciales de producción.

Los 16 escenarios cubren:

- Validación del login, visibilidad de contraseña y recuperación de conexión con Zoho.
- Layout en 320, 390, 834 y 1440 px; configuración y avatar a 320 × 568.
- Lobby, Projects, Inventory, Workshop, Library y Core; Dashboard, Lista, Board, Tabla y Calendario.
- Filtro de audiencia y apertura de panel con teclado.
- Menú móvil, diálogo anidado de avatar, descarte del borrador y fallback de imágenes.
- Resultados de búsqueda calculados en servidor y consultas fuera de orden.
- Creación de misión en móvil, contexto de proyecto, validación y guardado.
- Storage bloqueado, error y reintento en detalle de misión.
- API key sin falso éxito, envío único y cierre bloqueado durante guardado.

Las capturas y trazas se generan en `apps/dashboard/test-results/`, excluido de Git. CI ejecuta E2E después de `pnpm check`, usando la compilación de producción, y publica esos artefactos.

## Resultados locales

- Playwright sobre la compilación de producción: **16/16 escenarios aprobados** en 14.8 s (`CI=1 PLAYWRIGHT_CHANNEL=chrome node node_modules/@playwright/test/cli.js test`, desde `apps/dashboard`).
- Vitest: **51 pruebas aprobadas**, en 11 archivos relacionados con shell, paneles, creación, configuración, rutas y componentes compartidos.
- TypeScript, compilación de producción de Next.js y `git diff --check`: aprobados.
- Inspección visual de capturas de dashboard, configuración y avatar: completada.

## Límites

La evidencia local corresponde a Chrome y datos mock, con movimiento reducido. No certifica todos los permisos, datos o integraciones de producción. El login real con credenciales y la autenticación OIDC completa quedan fuera de esta evidencia; el escenario de Zoho verifica recuperación ante fallo de red. Los detalles de misiones y la configuración se ejercitan; las colecciones canónicas se prueban con fixtures mínimos.

La ejecución completa del workspace y PostgreSQL corresponde al pipeline del PR; los resultados anteriores son locales y no certifican CI ni preview.
