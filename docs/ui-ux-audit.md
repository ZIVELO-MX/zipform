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

## Segunda revisión: escritorio

Se revisaron selectores, Board, calendario y configuración con dos subagentes `gpt-5.6-luna`; los hallazgos se contrastaron con el código y los flujos E2E.

- Configuración conserva la ventana y bloquea cambios de sección durante guardado de perfil y operaciones de API keys. Evita perder la llave antes de mostrarla.
- El perfil admite Guardar con Enter, conserva el borrador tras fallos y evita envíos duplicados.
- El tirador del Board permite iniciar el movimiento sin abrir el detalle al hacer clic.
- El calendario permite abrir misiones con teclado y devuelve el foco al cerrar el panel.
- Los grupos de lista por proyecto muestran el color del proyecto.
- Los selectores de usuario y proyecto admiten consultas con espacios, selección con Enter y búsqueda limpia al reabrir. El selector de iconos también limpia la búsqueda al cerrar o eliminar.
- El componente compartido de entidades captura fallos de creación, conserva la consulta y evita duplicados. Actualmente no hay consumidores de su callback opcional `onCreate`; este manejo no tiene evidencia E2E en rutas de producto.

Ideas propuestas, sin implementar: mostrar filtros activos junto al título; abrir la edición de propiedades con un solo selector para reducir los popovers anidados.

Verificación local de esta segunda revisión:

- Build de producción de Next.js (incluye comprobación de tipos): aprobado.
- Playwright sobre producción: 23 escenarios verificados. La ejecución conjunta aprobó 22; se corrigió un selector ambiguo de la prueba de usuario y su repetición focalizada aprobó usuario y calendario (2/2). La captura final del calendario espera al contenido cargado.
- Los subagentes ejecutaron Vitest durante su revisión: dashboard 261/261 y UI 11/11, aprobados. Esta evidencia es local, no del pipeline del PR.
- `git diff --check`: aprobado.
- PR y CI quedan a cargo del usuario según su instrucción más reciente.

## Tercera revisión: búsqueda, cierre de misiones y paginación

- **Búsqueda:** títulos y contextos idénticos compartían el valor interno de selección, por lo que dos resultados aparecían seleccionados a la vez. Cada opción usa ahora su tipo e ID. Regresión E2E: elegir el segundo resultado con Flecha abajo y Enter abre su destino.
- **Completar misión:** la acción no capturaba errores y permitía nuevas pulsaciones durante el guardado. Reutiliza el manejo de errores existente y deshabilita la acción mientras está pendiente. Regresión E2E con fallo de conexión y reintento sin duplicados.
- **Colecciones paginadas:** los controles indican «Filtros de esta página» y «Orden de esta página» cuando hay más de una página. Regresión E2E con 26 registros y navegación a la segunda página; el Lobby conserva las etiquetas normales.

**Pendiente:** los filtros y el orden globales entre páginas requieren ampliar las consultas paginadas del servidor. El ajuste de etiquetas aclara el alcance actual; no implementa esa consulta global. No se cargan colecciones enteras en memoria para simularla.

Verificación local final: **26/26 E2E** sobre la compilación de producción (46.3 s), **21/21 pruebas focalizadas**, build con comprobación de tipos y `git diff --check` aprobados.
