# TLOZ — Visión de UI

## Filosofía del Producto

TLOZ debe sentirse como una herramienta de productividad profesional con una capa ligera de RPG.

La aplicación debe priorizar:

- Utilidad
- Claridad
- Velocidad
- Visibilidad

La capa de RPG existe para mejorar la comprensión y el engagement, no para convertir la aplicación en un juego.

---

## Principios de Diseño

- Layout compacto
- Navegación rápida
- Mínimos clics
- Densidad de información inspirada en Linear
- Simplicidad inspirada en Notion
- Organización flexible inspirada en Trello
- Útil antes que bonito
- Personalidad sin sacrificar productividad

---

## Idioma

Toda la interfaz estará en español.

Los nombres propios de elementos de videojuego conservan su nombre en inglés.

Ejemplos:

- Main Quest (no "Misión Principal")
- Side Quest
- Exploration Quest
- Farming Quest
- Quest Item

---

## Navegación

La navegación debe ser global.

Métodos de navegación primarios:

- Búsqueda
- Sidebar
- Breadcrumbs

La búsqueda se considera un mecanismo de navegación primario.

Los breadcrumbs son navegables: permiten al usuario regresar hacia atrás en la jerarquía (por ejemplo, Proyecto → Episodio → Mission → Detalle).

Los usuarios deben poder navegar hacia:

- Missions
- Proyectos
- Quest Items
- Recursos
- Vistas

desde una única experiencia de búsqueda global.

---

## Vistas

La misma información debe estar disponible a través de múltiples vistas.

Vistas requeridas:

- Vista de Lista
- Vista de Tabla
- Vista de Board
- Vista de Calendario

Las Missions sin fecha no aparecen en la Vista de Calendario.

Los usuarios eligen la vista que mejor se adapta a su flujo de trabajo.

---

## Dashboard

El dashboard muestra el trabajo del equipo completo.

Se puede filtrar por:

- Proyecto
- Episodio (Episodio I, Episodio II, etc.)
- Temporada

También se puede filtrar para ver únicamente el trabajo del usuario actual.

Secciones principales del dashboard:

- Quest activa actual
- Support Quest activa actual
- Main Quests
- Próximas Missions (Next)
- Missions futuras (Later)
- Proyectos

El dashboard debe dar visibilidad inmediata sobre las prioridades actuales.

---

## Experiencia de Mission

### Creación Rápida

Diseñada para captura rápida de tareas.

Campos mínimos requeridos.

Permite crear múltiples Missions sin salir del diálogo.

Objetivo: reducir la fricción entre la idea y su captura.

---

### Creación Detallada

Experiencia completa de creación de Mission.

Soporta:

- Descripción
- Dependencias
- Quest Items
- Recursos
- Clasificación Kano
- Fechas
- Checklists

---

## Detalle de Mission

El detalle de una Mission es accesible a través de:

- Panel lateral derecho
- Vista de página completa

El panel lateral ofrece un resumen rápido.

La vista de página completa provee capacidades completas de edición.

Los campos editables en cada vista dependen del esquema de la base de datos y se definirán posteriormente.

---

## Checklists

Subtareas simples basadas en checkboxes.

Inspirado en las task lists de GitHub.

No se requiere jerarquía de tareas anidadas.

---

## Recursos

Las Missions pueden contener recursos.

Ejemplos:

- Documentos
- Links
- Imágenes
- Archivos

Los recursos deben ser fáciles de adjuntar y acceder.

---

## Quest Items

Los Quest Items son entidades de primer nivel.

Las Missions bloqueadas deben mostrar visualmente los Quest Items requeridos.

Múltiples Quest Items deben aparecer como íconos agrupados, similar a un grupo de avatares.

Esto permite al usuario entender de inmediato qué está impidiendo el progreso.

---

## Pickers

Los pickers deben preferirse sobre los inputs de texto libre siempre que sea posible.

Ejemplos:

- Icon Picker
- Project Picker
- Mission Type Picker
- Quest Item Picker
- Assignee Picker
- Date Picker
- Kano Picker
- Resource Picker

El Icon Picker debe ser un componente reutilizable core usado en toda la aplicación.

---

## Actividad

Debe existir un historial básico de actividad.

Ejemplos:

- Mission creada
- Mission movida
- Quest Item completado
- Owner cambiado

El objetivo es visibilidad, no auditoría.

---

## Estilo Visual

- Light theme primero
- Noto Sans
- Hover states
- Toast notifications
- Alertas
- Diálogos
- Transiciones suaves
- Movimiento lúdico pero contenido

---

## Capa de RPG

Los conceptos de RPG deben permanecer visibles pero ligeros.

Ejemplos:

- Main Quest
- Side Quest
- Exploration Quest
- Farming Quest
- Quest Items

Evitar:

- Sistemas de XP
- Leaderboards
- Mecánicas competitivas
- Gamificación excesiva

---

## Criterios de Éxito

Los usuarios deben poder:

- Entender las prioridades actuales de inmediato
- Saber en qué están trabajando sus compañeros
- Encontrar información rápidamente
- Capturar ideas rápidamente
- Navegar con el mínimo esfuerzo

Si la aplicación sigue siendo útil después de remover la terminología de RPG, la UI es exitosa.
