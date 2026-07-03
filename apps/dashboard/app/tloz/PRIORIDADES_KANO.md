# Prioridades Kano de TLOZ

## Propósito

Esta clasificación sirve para priorizar fallos de TLOZ, tanto en la interfaz como
en el backend. La categoría describe el impacto funcional esperado, no sustituye
la evaluación de severidad, alcance o frecuencia.

Orden de atención:

1. **Must-have (Básicos):** si fallan, el usuario no puede confiar en TLOZ o no
   puede completar un flujo esencial.
2. **Performance (Desempeño):** su calidad, velocidad y facilidad de uso aumentan
   proporcionalmente la satisfacción.
3. **Delighter (Atractivos):** mejoran y diferencian la experiencia, pero su ausencia
   no bloquea el trabajo principal.

## Reglas para clasificar un fallo

- Si un fallo afecta capacidades de varias categorías, toma la categoría más alta.
- Toda pérdida, corrupción, exposición o acceso indebido de datos es **Must-have**.
- Si una capacidad Performance o Delighter impide completar un flujo esencial, el
  incidente se atiende como **Must-have**.
- Dentro de una categoría, ordenar los incidentes por severidad, usuarios afectados,
  frecuencia y disponibilidad de una alternativa temporal.

## Must-have (Básicos)

| Capacidad | Incluye | Por qué es básica |
|---|---|---|
| Acceso y navegación contextual | Lobby, sidebar, proyectos, Inventory, breadcrumbs y rutas de detalle | El usuario debe poder llegar al contexto y registro correctos. |
| Lectura de información | Dashboard, listas base, detalles de Mission, Project e Inventory | Sin datos correctos y disponibles, TLOZ no cumple su función principal. |
| Gestión de Missions | Crear, editar y eliminar; estado, tipo, proyecto, responsable y fechas | Es el flujo central de planificación y seguimiento del trabajo. |
| Gestión de Projects e Inventory | Crear y editar proyectos e items, con sus propiedades esenciales | Organiza el trabajo y los elementos necesarios para ejecutarlo. |
| Persistencia y consistencia | Escrituras y lecturas equivalentes en los drivers mock y Prisma | Una operación confirmada debe conservarse y devolver el mismo resultado. |
| Integridad y aislamiento de datos | Relaciones válidas, dependencias dentro del mismo proyecto, recursos con un solo propietario y validación de pertenencia en URLs | Evita datos corruptos, cruzados o mostrados en un contexto incorrecto. |
| Identidad y enlaces persistentes | Slugs de proyecto, `displayId` de Mission e IDs de Inventory | Los enlaces guardados deben seguir abriendo la entidad correcta. |
| Validación y manejo de fallos | Rechazo de entradas inválidas, estados no encontrados, mensajes de error y recuperación segura | Un error no debe guardar datos inválidos ni dejar la interfaz en un estado engañoso. |
| Estados de carga esenciales | Indicadores durante la carga de rutas y operaciones | Evitan que una espera parezca una pantalla rota o provoque acciones duplicadas. |
| Acceso de usuarios y asignación | Carga de usuarios y asignación de responsables | Permite determinar quién posee y ejecuta el trabajo. |

Ejemplos: no se puede abrir una Mission existente; una actualización aparenta éxito
pero no se guarda; una dependencia enlaza proyectos distintos; un usuario ve datos
de otro contexto; crear una Mission produce registros duplicados.

## Performance (Desempeño)

| Capacidad | Incluye | Cómo aumenta su valor |
|---|---|---|
| Vistas de trabajo | Dashboard, Board, Lista, Tabla y Calendario | Más claridad y adecuación de cada vista reducen el tiempo para entender y operar el trabajo. |
| Filtros, orden y agrupación | Proyecto, temporada, episodio, responsable, estado y criterios de orden | Cuanto más precisos y rápidos sean, más fácil es encontrar y priorizar información. |
| Búsqueda global | Localización de Missions, Projects e Inventory | La velocidad, cobertura y relevancia determinan cuánto trabajo ahorra. |
| Resúmenes y foco | Trabajo actual, próximas tareas, trabajo futuro, actividad reciente y límites de Quest/Support | Una síntesis más correcta y oportuna mejora las decisiones del equipo. |
| Feedback de mutaciones | Confirmaciones, errores visibles, actualización optimista y reversión | Una respuesta más inmediata y fiable reduce incertidumbre y repetición de acciones. |
| Rendimiento de datos e interfaz | Tiempos de carga, hidratación, consultas, renderizado y transiciones entre contextos | Cada mejora de velocidad aumenta la fluidez y capacidad de trabajo. |
| Relaciones de trabajo | Checklist, dependencias, Inventory relacionado y recursos adjuntos | Una gestión más completa y cómoda mejora la ejecución sin definir por sí sola el acceso básico. |
| Adaptación por contexto | Datos limitados al proyecto y vistas compatibles para proyectos de sistema | Una adaptación más precisa reduce ruido y errores de operación. |

Ejemplos: un filtro devuelve resultados incompletos; el Calendario coloca una Mission
en una fecha incorrecta; el Dashboard tarda demasiado; una actualización funciona
pero no muestra feedback; la búsqueda omite entidades válidas.

## Delighter (Atractivos)

| Capacidad | Incluye | Por qué es atractiva |
|---|---|---|
| Drag-and-drop del Board | Movimiento por puntero, touch o teclado, anuncios accesibles y reversión visual | Hace más directa y satisfactoria una operación que también puede realizarse editando el estado. |
| Preferencias persistidas | Recordar vista y opciones de presentación en `localStorage` | Devuelve al usuario a su forma preferida de trabajar sin configuración repetida. |
| Personalización visual | Iconos, colores, badges y borde de foco según tipo o estado | Refuerza reconocimiento y personalidad sin ser necesaria para completar el flujo. |
| Selectores enriquecidos | Historial de iconos, calendario, búsqueda de usuarios y popovers contextuales | Reduce fricción y ofrece una interacción más pulida que los controles básicos. |
| Detalles de presentación | Avatares, empty states, tooltips, animaciones y transiciones | Aumentan claridad y agrado, pero su degradación no impide operar. |
| Navegación de detalle mejorada | SlideOver y opción de abrir la entidad en página completa | Conserva el contexto y acelera la inspección frente a navegar siempre a otra página. |

Ejemplos: no se recuerdan las preferencias; falla el drag-and-drop pero aún se puede
cambiar el estado desde el editor; un color o icono es incorrecto; el SlideOver no
abre, pero la página completa sigue disponible.
