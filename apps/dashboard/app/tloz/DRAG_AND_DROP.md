# Drag and drop del Board

## Decisión

El Board usa `@dnd-kit/core@6.3.1` para mover misiones entre estados.

Se eligió dnd-kit porque:

- soporta puntero, touch y teclado mediante sensores;
- incluye atributos ARIA, instrucciones y anuncios para lectores de pantalla;
- permite múltiples zonas de destino sin imponer una estructura visual;
- mueve los elementos con `transform`, evitando recalcular el layout durante el arrastre;
- mantiene la persistencia existente mediante `patchMissionStatus`.

Pragmatic Drag and Drop también se evaluó. Su núcleo no proporciona una interacción accesible completa por defecto y recomienda construir controles alternativos y live regions. Para este Board, dnd-kit reduce esa superficie y conserva la interacción por teclado dentro del mismo modelo.

## Interacción

- Puntero o touch: arrastrar desde el handle de cada tarjeta y soltar en una columna.
- Teclado: enfocar el handle, presionar `Espacio` o `Enter`, mover con flechas, soltar con `Espacio` o `Enter` y cancelar con `Escape`.
- El clic fuera del handle abre el detalle de la misión.
- El cambio se refleja de forma optimista y se revierte si falla la persistencia.

## Estructura

- `DndContext` coordina sensores, colisiones y anuncios.
- Cada estado es un `useDroppable` con un identificador `status:<estado>`.
- Cada misión es un `useDraggable` y expone sus listeners únicamente en el handle.
- `BoardClient` conserva el estado optimista y llama a `patchMissionStatus` al terminar el arrastre.

## Referencias

- https://docs.dndkit.com/api-documentation/context-provider
- https://docs.dndkit.com/guides/accessibility
- https://docs.dndkit.com/api-documentation/sensors/keyboard
- https://docs.dndkit.com/api-documentation/droppable
