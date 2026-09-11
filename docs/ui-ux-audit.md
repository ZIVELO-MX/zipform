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

**Pendiente en la tercera revisión (resuelto en la cuarta):** los filtros y el orden globales entre páginas requieren ampliar las consultas paginadas del servidor. El ajuste de etiquetas aclara el alcance actual; no implementa esa consulta global. No se cargan colecciones enteras en memoria para simularla.

Verificación local final: **26/26 E2E** sobre la compilación de producción (46.3 s), **21/21 pruebas focalizadas**, build con comprobación de tipos y `git diff --check` aprobados.


## Cuarta revisión: consultas globales y borradores de escritorio

Fecha: 2026-09-06. Se mantuvo Ponytail y se delegaron consultas y revisiones acotadas a `gpt-5.6-sol` y `gpt-5.6-luna`.

- Projects, Inventory, Workshop y Library filtran por responsable y estado, y ordenan por título o fecha **antes de paginar**. Las consultas de PostgreSQL aplican filtros y cursores en SQL parametrizado con límite; no cargan la colección completa en el navegador. El adaptador conserva el orden del store para no alterar los cursores por diferencias de colación.
- Los filtros y el orden quedan en la URL. Cambiarlos reinicia la paginación; Siguiente y Primera página conservan la consulta. Los controles reflejan inmediatamente la selección y bloquean nuevos cambios durante la carga.
- Las colecciones muestran estados vacíos y encabezados de su entidad. Se retiran las etiquetas de alcance limitado a la página de la revisión anterior.
- Un cursor inexistente muestra una pantalla recuperable. Primera página conserva filtros y vuelve a cargar la ruta; una navegación cliente sin recarga dejaba el error montado y fue corregida con un enlace nativo.
- Markdown espera el resultado real del guardado. Un fallo mantiene el borrador abierto y permite reintentar el mismo texto; Guardar, Cancelar y el textarea quedan bloqueados durante el envío.
- Guardar otra propiedad en Workshop o Library ya no desmonta el detalle por un cambio de revisión ni descarta el borrador de Markdown.

Verificación **local** final:

- **35/35 E2E aprobados** sobre la compilación de producción en Chrome: 47.2 s. Comando desde `apps/dashboard`: `CI=1 PLAYWRIGHT_CHANNEL=chrome node node_modules/@playwright/test/cli.js test`.
- Regresiones con 30 registros por colección: orden global, segunda página, cambio de responsable desde esa página, ocultar completadas y recarga conservando controles. Fallo/reintento de Markdown, guardado de propiedades con borrador abierto y recuperación de cursor inválido.
- Dashboard verificado también a **1024 × 768** y **1920 × 900**, además de los tamaños previos. Inspección visual de capturas del dashboard de escritorio, colección filtrada y editor tras fallo.
- **49/49 pruebas focalizadas** de Vitest: 28 de dashboard y 21 de stores/adaptador. TypeScript de dashboard y data, build Next.js y `git diff --check` aprobados.
- Se añadió una prueba de integración PostgreSQL para alias, fechas ausentes, empates, cursores excluidos y valores con comillas. El archivo se carga, pero sus **25 casos se omiten localmente** porque `TEST_DATABASE_URL` no está configurado. No se declara validación contra PostgreSQL real.

El PR y su pipeline siguen a cargo del usuario. Esta evidencia no certifica el login real, todos los roles ni las integraciones de producción; esas comprobaciones siguen necesarias antes de declarar escritorio listo al 100 %.


## Quinta revisión: ventanas de tareas y contenido enriquecido

Fecha: 2026-09-07. Se aplicó la densidad compacta de TLOZ con las skills Impeccable, baseline-ui y Ponytail. Revisiones acotadas delegadas a `gpt-5.6-luna`.

- El panel lateral abre con un ancho objetivo de 960 px, limitado por el viewport y todavía redimensionable. Cabecera, cierre y acción de completar más compactos; título a todo el ancho y enlace directo a página completa.
- Las propiedades ocupan una columna de 260 px. En el panel dejan de ser sticky para permitir llegar a toda la información al desplazar; la vista de página conserva su comportamiento. Etiquetas con mayor contraste.
- El detalle vacío ofrece «Añadir detalle…» directamente. Markdown contiene URLs y títulos largos, permite desplazar código y tablas horizontalmente y evita anidar bloques `pre` o colocar figuras dentro de ellos.
- Workshop y Library consultan la actividad del contenido v2, muestran etiquetas de documento y refrescan la actividad después de guardar. Se elimina el enlace a Missions que apuntaba a un proyecto inexistente; documentos sin ruta de actividad no muestran un error artificial.
- La regla global de movimiento reducido asignaba una transición a todas las propiedades de todos los elementos, incluidas las dimensiones y transformaciones SVG. Mermaid medía valores intermedios y producía diagramas diminutos o recortados. Se desactivan las transiciones en ese modo; no se modifica Mermaid ni se añade código de medición al producto.

La regresión E2E verifica paneles a 1024, 1440 y 1920 px, acciones accesibles, edición vacía, contenido largo y límites reales del SVG tanto con movimiento reducido como normal. Las pruebas de borradores verifican también actividad v2 y su actualización después de guardar.

Verificación **local** final:

- **40/40 E2E aprobados** sobre producción local en Chrome, en **47.7 s**: `CI=1 PLAYWRIGHT_CHANNEL=chrome node node_modules/@playwright/test/cli.js test`, desde `apps/dashboard`.
- La primera ejecución completa terminó con 39/40: la prueba de Library reabría Control antes de finalizar su cierre. Se añadió una espera por la desaparición del menú y la repetición completa pasó.
- **26/26 pruebas focalizadas** de Vitest en `mission-detail-ui`, `document-entity-page` y `mermaid-download`; build Next.js con validación de tipos y `git diff --check` aprobados.
- Inspección visual de las capturas de tareas a 1024/1440 px y del contenido largo con Mermaid: propiedades visibles, diagrama completo, tablas y código contenidos. La suite cubre también 1920 px y las regresiones móviles existentes.

Capturas en `apps/dashboard/test-results/task-panel-*.png`, excluidas de Git. PR y pipeline siguen a cargo del usuario; la evidencia usa datos mock y no certifica autenticación real ni producción al 100 %.

## Sexta revisión: vistas del proyecto

Fecha: 2026-09-08. Implementa el diagnóstico de Lista, Tabla, Board, Dashboard y Calendario, incluyendo la navegación temporal autorizada después de la revisión. Se mantuvo TLOZ como referencia visual y Ponytail para evitar dependencias nuevas; las tareas acotadas se delegaron a `gpt-5.6-luna` y `gpt-5.6-sol` y se revisaron durante la integración.

- **Lista:** IDs en una línea; título con prioridad de ancho y protección para cadenas sin espacios. Proyecto y responsable pasan debajo del título cuando el espacio del workspace es limitado; vuelven a una fila al disponer de más ancho.
- **Tabla:** orden de columnas Misión, Estado, Responsable, Vence, Tipo y Proyecto. Anchos definidos para evitar que un título ensanche toda la tabla; primera columna fija al desplazar. Los metadatos secundarios conservan acceso mediante desplazamiento horizontal.
- **Board y Tabla:** controles de desplazamiento visibles cuando hay columnas fuera del área disponible, con límites deshabilitados y navegación nativa del área. Board tiene altura acotada y desplazamiento por columna, manteniendo el encabezado mientras se recorren muchas tareas.
- **Fechas:** presentación compartida en Dashboard, Lista, Tabla, tarjetas, detalle y Calendario. Rojo solo para vencidas pendientes; hoy, futuras y completadas se distinguen mediante texto/estado. Comparación por fecha local, validación de fecha, render inicial estable entre servidor y navegador y actualización mediante un temporizador compartido al llegar la medianoche.
- **Calendario:** Agenda con todas las fechas agrupadas por día; Mes y Semana con controles anterior/siguiente/Hoy y tablas nativas. Estado, responsable, títulos contenidos y acceso a todas las tareas, también cuando un día tiene más de cuatro. Los periodos vacíos mantienen su cuadrícula; una agenda sin fechas permite volver directamente a Lista.
- **Dashboard:** tarjetas de foco más compactas; Main Quests excluye únicamente las tareas ya mostradas en foco, reutilizando la misma selección. Se conserva acceso al resto de Main Quests. Se elimina el proyecto duplicado cuando no hay fecha y se contienen nombres, descripciones y títulos largos.
- **Navegación:** selector de vista directamente en la cabecera de escritorio; reutiliza preferencias y vistas admitidas existentes.

Las pruebas añadidas verifican columnas prioritarias y título fijo, persistencia del selector, desplazamiento de Board sin abrir tareas, encabezados con muchas tarjetas, títulos de 200 caracteres sin espacios, seis tareas en un día, Mes/Semana, cambio diciembre/enero, periodo vacío, agenda sin fechas y clasificación de fechas al cruzar medianoche en America/Mexico_City.

Durante la integración se corrigieron la altura ilimitada del Board y el recorte excesivo del nombre del responsable. Los fixtures de Calendario/fechas actualizan misiones del servidor mock aislado; no utilizan credenciales ni datos reales. Las capturas y los snapshots de diseño permanecen excluidos de Git.

Verificación **local** final:

- **45/45 E2E aprobados** en Chrome sobre compilación de producción, **50.1 s**. Comando desde `apps/dashboard`: `CI=1 PLAYWRIGHT_CHANNEL=chrome node node_modules/@playwright/test/cli.js test`.
- **31/31 pruebas focalizadas** de Vitest: calendario, presentación de fechas, selección de foco, detalle y capacidades de Control. Comando desde `apps/dashboard`: `node node_modules/vitest/vitest.mjs run components/tloz/mission-calendar.test.ts components/tloz/mission-due-date-state.test.ts app/tloz/dashboard-client.test.ts components/tloz/mission-detail-ui.test.ts components/tloz/tloz-control-capabilities.test.ts`.
- Build de producción Next.js con comprobación de tipos y `git diff --check`: aprobados.
- Capturas revisadas: Dashboard, Lista, Tabla y Board a 1024 px; Agenda a 1440 px; Mes y Semana a 1024 px. Los siete días caben en el workspace de escritorio de 1024 px. Se conservaron las regresiones móviles y de paneles de tareas.

Rama dedicada `fix/desktop-project-views`, basada en `e6a1c0d` de las correcciones anteriores. PR y pipeline siguen a cargo del usuario; no se declara CI aprobado ni validación con autenticación o datos reales. No se añadieron dependencias ni se modificaron contratos HTTP o migraciones.


## Séptima revisión: recuperación de errores en desktop

Fecha: 2026-09-08. Rama `fix/desktop-edit-recovery`, basada en `445f908`. Se mantuvo la interfaz compacta de TLOZ y el alcance acotado de Ponytail; un subagente implementó el arreglo de Board y otro revisó las regresiones de edición. Integración y verificación en el hilo principal.

- **Edición de tareas:** título y descripción permanecen editables con el borrador intacto si falla el guardado. El foco vuelve al campo para reintentar. Los cambios recibidos de la misión conservan borradores modificados; cambiar de misión limpia el historial local y el modo de edición.
- **Checklist:** renombrar o añadir una subtarea también conserva el texto en caso de error. Escape cancela título, descripción y subtarea sin propagarse al cierre del panel ni guardar accidentalmente. Los campos se bloquean durante su guardado; las acciones de renombrar/eliminar respetan el permiso de edición del documento.
- **Board:** impide movimientos repetidos mientras guarda, con handles deshabilitados y un aviso visible. Un fallo restaura únicamente el estado de la misión afectada sobre la lista actual y mantiene un panel abierto durante la petición. El mensaje de error y el área de columnas comparten una altura acotada.
- **Propiedades:** la fecha vencida admite dos líneas para mostrar el año completo en el panel lateral; el resto de propiedades mantiene su presentación compacta.

Verificación **local**:

- **47/47 E2E aprobados**, Chrome sobre build de producción, **56.2 s**. `CI=1 PLAYWRIGHT_CHANNEL=chrome node node_modules/@playwright/test/cli.js test` desde `apps/dashboard`.
- **25/25 pruebas focalizadas aprobadas**. `node node_modules/vitest/vitest.mjs run components/tloz/mission-detail-ui.test.ts components/tloz/slide-over-contract.test.ts components/tloz/mission-inline-editor.test.ts components/tloz/document-view-interaction.test.ts` desde `apps/dashboard`.
- Build Next.js de producción, comprobación de tipos y `git diff --check`: aprobados.
- Regresiones nuevas: fallo de movimiento mediante teclado con apertura de panel durante la petición; rollback a la columna original y controles habilitados al terminar; fallo de título, reintento exitoso, descripción, creación y renombrado de subtareas; Escape conserva el panel y cancela únicamente la edición; fecha sin truncamiento.
- Capturas finales revisadas: panel de edición y Board después de recuperarse del error. La suite conserva las comprobaciones de paneles a 1024/1440/1920 px, vistas del proyecto, pantallas móviles y movimiento reducido.

Las pruebas usan sesión sintética y servidor mock local. CI, PR y autenticación real siguen pendientes a cargo del usuario, según lo acordado. No se incorporaron dependencias, secretos, cambios de API ni migraciones. Las capturas y el borrador de descripción del PR siguen excluidos de Git.


## Octava revisión: formularios compartidos de frontend

Fecha: 2026-09-08. Rama `fix/frontend-resource-forms`, basada en `f3d23a2`. Se aplicaron Ponytail, baseline-ui y las pautas de accesibilidad conservando la densidad de TLOZ. Un subagente revisó e implementó propiedades y ColorPicker; la integración y las regresiones E2E se realizaron en el hilo principal.

- **Recursos:** el formulario espera el resultado asíncrono antes de limpiar título, URL/identificador e icono. Un fallo conserva el borrador y muestra un error asociado al grupo; el mensaje entra en el área visible y el foco vuelve a Adjuntar para reintentar. Durante la petición los controles quedan bloqueados y se muestra el estado de guardado. Al guardar se devuelve el foco al botón de apertura.
- **Creación de misiones:** Enter dentro del formulario de recursos adjunta al borrador local y evita enviar la misión completa. El mismo componente conserva sus consumidores síncronos y los asíncronos del detalle.
- **Propiedades personalizadas:** Escape restaura el valor anterior de texto, número o fecha y evita el guardado por blur. El bloqueo durante una actualización incluye los controles dentro de popovers, evitando cambios con la misma revisión mientras la primera petición sigue pendiente.
- **Colores y popovers:** Escape restaura el color sin guardar; Enter evita un submit del formulario padre. Los popovers permiten cancelar el campo antes de procesar su cierre, corrigiendo la pérdida del borrador por la captura anticipada de Escape.

Verificación **local**:

- **50/50 E2E aprobados** en Chrome sobre el build final, duración reportada **1.0 min**. Desde `apps/dashboard`: `CI=1 PLAYWRIGHT_CHANNEL=chrome node node_modules/@playwright/test/cli.js test`.

- **20/20 pruebas focalizadas aprobadas**. Desde la raíz: `node apps/dashboard/node_modules/vitest/vitest.mjs run apps/dashboard/components/tloz/document-property-fields.test.ts apps/dashboard/components/tloz/mission-detail-ui.test.ts packages/ui/src/components/color-picker.test.ts`.
- Build Next.js de producción y comprobación de tipos: aprobados. Desde `apps/dashboard`: `TLOZ_DATA_DRIVER=mock AUTH_SECRET=zipform-local-e2e-only node node_modules/next/dist/bin/next build`.
- Regresiones E2E nuevas: recurso con error y reintento sin duplicados, foco de reintento y error visible a 1024 px; Enter adjunta al borrador sin enviar la misión; cancelación de campo y color sin peticiones, bloqueo durante guardado y reintento del texto conservado.
- `git diff --check`: aprobado. Capturas locales excluidas de Git.

Las pruebas utilizan un servidor mock aislado y una sesión sintética. CI, PR y autenticación real siguen pendientes a cargo del usuario, según lo acordado. No se añadieron dependencias, cambios de API ni migraciones.


## Novena revisión: selectores y relaciones

Fecha: 2026-09-08. Rama `fix/frontend-relation-pickers`, basada en `32c3a6b`. Se mantuvo la densidad compacta de TLOZ y Ponytail para limitar el cambio a componentes existentes. Un subagente corrigió EntityPicker; integración y E2E en el hilo principal.

- **Dependencias:** el selector espera el resultado del vínculo, conserva la selección tras un fallo y ofrece Reintentar. El error entra en el área visible y el botón de reintento recibe el foco. Se bloquean los controles durante la petición.
- **Creación:** Dependencias admite misiones y Quest Items muestra Inventory directamente; se elimina el cambio de tipo que llevaba a una lista vacía en esas secciones. Si no hay candidatos se muestra un estado explícito con Cancelar.
- **EntityPicker:** Enter no envía el formulario padre con búsqueda vacía ni sin resultados. Se mantienen selección exacta, primera coincidencia, creación y composición IME. Los controles dentro del selector abierto también respetan disabled.
- **Solo lectura:** se ocultan agregar/quitar dependencias y cambiar requisitos de Inventory cuando no hay permiso de actualización. Se mantiene la navegación a elementos vinculados.
- **Foco:** los formularios de relaciones y recursos esperan al render del botón de apertura para restaurar el foco después de guardar o cancelar; se elimina una carrera con las actualizaciones de React.

Verificación **local**:

- **53/53 E2E aprobados**, Chrome sobre build final, **2.2 min**. Desde `apps/dashboard`: `CI=1 PLAYWRIGHT_CHANNEL=chrome node node_modules/@playwright/test/cli.js test`.

- **18/18 pruebas focalizadas aprobadas**. Desde la raíz: `node apps/dashboard/node_modules/vitest/vitest.mjs run apps/dashboard/components/tloz/mission-detail-ui.test.ts apps/dashboard/components/tloz/tloz-create.test.ts packages/ui/src/components/entity-picker.test.ts`.
- Build Next.js de producción y comprobación de tipos: aprobados.
- Regresiones nuevas: vínculo con fallo y reintento sin duplicados, selección y foco conservados; Inventory directo al crear, búsquedas vacías/sin coincidencias con Enter sin enviar la misión; sesión sintética de solo lectura con navegación y sin acciones de edición de relaciones.
- Captura del formulario de dependencia con error revisada a 1024 px; mensaje, selección y reintento contenidos en el panel.
- `git diff --check`: aprobado.

Servidor mock local y sesiones sintéticas. CI, PR y autenticación real pendientes a cargo del usuario según lo acordado. No se modificaron APIs públicas, secretos, dependencias ni migraciones. Capturas y borrador de PR excluidos de Git.


## Décima revisión: guardado del checklist e historial

Fecha: 2026-09-09. Rama `fix/desktop-checklist-saves`, basada en `4e65a26`. Correcciones acotadas a los componentes existentes con Ponytail, densidad TLOZ y revisión independiente de un subagente.

- **Eliminar subtarea:** la confirmación espera al servidor antes de cerrarse. Si falla, conserva la subtarea, muestra el error dentro del diálogo y permite reintentar. Eliminar, Cancelar y Escape no descartan la confirmación durante la petición.
- **Checklist y Markdown:** los guardados del cuerpo se bloquean mientras existe otro en curso; se deshabilitan sus controles y se muestra «Guardando…». También se deshabilitan durante la restauración del historial. Las cadenas largas se ajustan al ancho de la fila y del diálogo.
- **Borrador al filtrar:** cambiar entre Todos y Pendientes ya no desmonta el formulario de nueva subtarea. Se conserva el texto incluso al cambiar de filtro mientras falla su guardado.
- **Deshacer y rehacer:** las pilas solo cambian después de una respuesta exitosa. Una edición fallida no crea entradas y una restauración fallida conserva la entrada para reintentar. Los atajos requieren foco dentro del detalle, respetan campos de texto y confirmaciones y no repiten una restauración pendiente.
- **Prueba de Board:** el arrastre por teclado espera a que el lector de pantalla anuncie la columna antes de soltar la tarjeta, evitando una carrera del guion automatizado.

Verificación **local**:

- Build Next.js de producción y comprobación de tipos aprobados: `TLOZ_DATA_DRIVER=mock AUTH_SECRET=zipform-local-e2e-only node node_modules/next/dist/bin/next build`, desde `apps/dashboard`.
- **19/19 pruebas focalizadas aprobadas**: `node apps/dashboard/node_modules/vitest/vitest.mjs run apps/dashboard/components/tloz/mission-detail-ui.test.ts apps/dashboard/components/tloz/mission-document.test.ts apps/dashboard/components/tloz/slide-over-contract.test.ts`, desde la raíz.
- **55/55 E2E aprobados**, Chrome sobre build de producción, **1.2 min**: `CI=1 PLAYWRIGHT_CHANNEL=chrome node node_modules/@playwright/test/cli.js test`, desde `apps/dashboard`. La primera ejecución obtuvo 54/55; después de sincronizar el arrastre del Board, su prueba focalizada y la suite completa pasaron.
- Captura del diálogo con error revisada a 1024 × 768: mensaje y acciones visibles, sin desbordamiento. `git diff --check` aprobado.
- Regresiones nuevas: bloqueo de cambios del checklist durante guardado, eliminación fallida y reintento, texto largo a 1024 px, borrador al filtrar, historial tras ediciones fallidas, atajos dentro de confirmaciones y bloqueo durante restauración.

Límites: servidor mock y sesiones sintéticas; autenticación real y CI sin verificar. El flujo antiguo de restauración aún escribe metadatos y cuerpo en dos peticiones: un fallo exclusivo de la segunda puede dejar una restauración parcial; la ruta canónica utiliza una sola mutación. No se modifica en esta ronda la coordinación de guardados entre cuerpo y propiedades independientes. PR a cargo del usuario según el acuerdo previo. Sin cambios de API, migraciones ni dependencias; capturas y borrador del PR excluidos de Git.


## Undécima revisión: coordinación de edición y restauración atómica

Fecha: 2026-09-10. Rama `fix/desktop-atomic-history`, basada en `274ecb6`. Ponytail y baseline-ui aplicadas sobre componentes existentes; un subagente revisó persistencia e integración y otro implementó bloqueos de propiedades y selectores.

- **Deshacer sin restauraciones parciales:** la ruta antigua usa ahora una Server Action que envía título, resumen, icono y cuerpo juntos a `updateMission`, y devuelve el detalle actualizado. El driver Prisma ya reemplaza cuerpo, checklist y progreso en la misma transacción; no se modifican drivers ni migraciones. Se elimina el segundo guardado independiente del cuerpo. Las pruebas cubren permisos, una sola mutación, error sin fallback y restauración del checklist persistida tras recargar.
- **Guardados coordinados:** cabecera, Markdown, checklist, propiedades principales y personalizadas se bloquean entre sí mientras guardan. Se impiden cambios simultáneos sobre la misma revisión; el bloqueo se libera también tras un error. Los borradores y selectores abiertos permanecen montados.
- **Selectores:** fecha, usuario e icono respetan disabled dentro de sus popovers; también sus acciones de limpiar y, en el calendario, navegación y días. Se propaga el bloqueo al formulario de creación y al icono de recursos. Los popovers pueden cerrarse sin esperar al guardado.
- **Búsqueda de responsable:** Enter con búsqueda vacía o sin coincidencias no envía el formulario padre. Se conserva la selección de coincidencias y la composición IME.
- **Pruebas existentes:** el contrato estático de SelectTrigger permite atributos adicionales manteniendo la comprobación del ancla SelectValue de Radix.

Verificación **local**:

- Build de producción y tipos aprobados: `TLOZ_DATA_DRIVER=mock AUTH_SECRET=zipform-local-e2e-only node node_modules/next/dist/bin/next build`, desde `apps/dashboard`.
- **37/37 pruebas focalizadas aprobadas**: `node apps/dashboard/node_modules/vitest/vitest.mjs run apps/dashboard/app/tloz/actions.test.ts apps/dashboard/components/tloz/mission-inline-editor.test.ts apps/dashboard/components/tloz/document-property-fields.test.ts apps/dashboard/components/tloz/mission-document.test.ts apps/dashboard/components/tloz/tloz-create.test.ts`, desde la raíz.
- **56/56 E2E aprobados**, Chrome, **1.4 min**: `CI=1 PLAYWRIGHT_CHANNEL=chrome node node_modules/@playwright/test/cli.js test`, desde `apps/dashboard`. Antes pasaron los cinco escenarios focalizados de esta ronda.
- Captura a 1440 × 900 revisada tras un fallo al quitar la fecha: selector contenido en el panel, valor conservado y controles disponibles para reintentar.
- `git diff --check`: aprobado.

Se resuelven los dos pendientes de la décima revisión sobre restauración parcial y coordinación entre cuerpo y propiedades. El bloqueo coordina ediciones dentro del mismo panel; la concurrencia entre sesiones sigue dependiendo de los contratos existentes del servidor. Sesiones sintéticas y servidor mock local; autenticación real y CI sin verificar. PR a cargo del usuario según el acuerdo previo. Capturas y borrador de PR excluidos de Git; sin dependencias ni migraciones nuevas.


## Duodécima revisión: borradores y foco de edición

Fecha: 2026-09-10. Rama `fix/desktop-draft-focus`, basada en `2980787`. Ponytail, baseline-ui y pautas de accesibilidad; un subagente corrigió el formulario de creación y revisó la gestión de foco de Markdown.

- **Escape en Markdown:** cancela únicamente la edición del textarea, restaura el texto guardado y conserva el panel abierto. Respeta composición IME y bloqueos de guardado.
- **Foco y errores:** abrir Editar desde el menú coloca el foco en el textarea. Un fallo conserva el borrador, muestra un error asociado al campo y devuelve el foco después de que se habilita. Guardar o cancelar devuelve el foco al control de apertura disponible.
- **Copiar:** durante la edición copia el borrador visible; fuera de edición copia el texto guardado.
- **Creación:** un fieldset nativo bloquea los campos de texto, color y botones mientras se envía el formulario. Se conservan los bloqueos explícitos de selectores y se ignoran callbacks tardíos para evitar modificar datos ya enviados. El fallo mantiene nombre, descripción, detalle y color; permite reintentar. No cambia el diseño compacto del formulario.

Verificación **local**:

- Build de producción y tipos aprobados: `TLOZ_DATA_DRIVER=mock AUTH_SECRET=zipform-local-e2e-only node node_modules/next/dist/bin/next build`, desde `apps/dashboard`.
- **19/19 pruebas focalizadas aprobadas**: `node apps/dashboard/node_modules/vitest/vitest.mjs run apps/dashboard/components/tloz/mission-detail-ui.test.ts apps/dashboard/components/tloz/tloz-create.test.ts apps/dashboard/components/tloz/slide-over-contract.test.ts`, desde la raíz.
- **58/58 E2E aprobados**, Chrome, **1.5 min**: `CI=1 PLAYWRIGHT_CHANNEL=chrome node node_modules/@playwright/test/cli.js test`, desde `apps/dashboard`.
- Tras ajustar únicamente el borde de foco, build y tipos aprobados de nuevo; **2/2 E2E de Markdown aprobados**, **4.5 s**, mediante `--grep 'markdown keeps|markdown editing'`. Captura final a 1440 × 900 revisada: borde completo dentro del campo, mensaje y botones visibles.
- `git diff --check`: aprobado.
- Casos focalizados aprobados: creación de Mission con fallo y reintento, bloqueo de nombre/descripción/color en Project, error y foco de Markdown, copia del borrador y cancelación con Escape o botón sin cerrar el panel. El selector de creación de Project se acotó al botón de la vista tras detectar dos controles con el mismo nombre al abrir Control.

Sesiones sintéticas y datos mock locales; portapapeles probado únicamente con texto del fixture en Chrome automatizado. Autenticación real y CI sin verificar; PR a cargo del usuario según el acuerdo previo. Sin cambios de API, dependencias ni migraciones. Capturas y borrador del PR excluidos de Git.
