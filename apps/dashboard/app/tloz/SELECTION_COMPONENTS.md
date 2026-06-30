# Componentes de selección

## Arquitectura

Los patrones visuales y de interacción reutilizables viven en `@zipform/ui`:

- `IconPicker`: buscador de iconos con historial reciente en `localStorage`.
- `UserPicker`: selección de usuarios por nombre o username.
- `DatePicker`: selección de una fecha mediante `Calendar` dentro de `Popover`.
- `Popover`, `Calendar` y `Toaster`: primitives compartidos basados en shadcn/ui.

La aplicación TLOZ conserva la orquestación específica:

- define los 10 iconos disponibles y el color correspondiente al tipo de misión;
- proporciona proyectos, episodios y usuarios;
- ejecuta las server actions de persistencia;
- comunica save, update, success y error mediante Sonner.

Las páginas solo obtienen datos y componen `MissionInlineEditor`; no duplican la lógica de los pickers.

## Comportamiento

### Iconos

El picker recibe una lista genérica de opciones. TLOZ limita la lista a 10 iconos de Lucide. Los últimos 4 iconos elegidos se guardan con una clave configurable y aparecen en “Usados recientemente”. El color se recibe como prop, por lo que cada misión conserva el color de su tipo.

### Usuarios

El picker recibe objetos mínimos (`id`, `name`, `username`, `avatarUrl`) y filtra por nombre o username. No depende de los tipos de TLOZ.

### Fechas

El picker expone fechas como `YYYY-MM-DD` para evitar acoplar la capa UI al formato de persistencia. El calendario usa la zona local del navegador y el texto visible se formatea con `Intl.DateTimeFormat`.

### Feedback y loading

`Toaster` se monta una sola vez en el root layout. Las mutaciones de misión y movimientos del Board generan mensajes de éxito o error. El loading de TLOZ reutiliza `Skeleton` en el límite de ruta existente; no se agregan skeletons redundantes en componentes que ya reciben datos resueltos por el servidor.

## Dependencias

Los primitives siguen la documentación vigente de shadcn/ui para Popover, Calendar, Sonner y Skeleton. Las dependencias se administran desde el workspace `@zipform/ui` con pnpm.
