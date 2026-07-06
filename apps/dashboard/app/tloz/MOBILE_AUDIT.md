# Auditoría mobile de TLOZ

Fecha: 2026-07-05

## Alcance

La navegación móvil de `/tloz` prioriza únicamente las vistas **Lista** y
**Tabla**. El sidebar móvil existente queda fuera de este cambio. Dashboard,
Board y Calendario siguen disponibles en desktop, pero no se presentan como
opciones en mobile.

## Errores encontrados

| Prioridad | Error | Impacto | Resolución |
| --- | --- | --- | --- |
| Alta | Lista renderizada con cuatro columnas de ancho fijo | El contenido excedía el viewport y ocultaba el título o el área táctil | En mobile se muestra la identidad de la misión; proyecto, owner y fecha reaparecen desde `md` |
| Alta | Lista y tabla construían el detalle con el ID interno | La URL no coincidía con la ruta canónica pública basada en `displayId` | Ambas vistas usan `missionHref(project, displayId)` |
| Alta | El detalle mobile no tenía una salida directa al listado | Era posible entrar al detalle y perder el contexto de navegación | Se añadió una cabecera mobile sticky con regreso a `/tloz` |
| Media | Tabla solo respondía a click/tap | Las filas no podían abrirse usando teclado | Las filas seleccionables aceptan foco, Enter y Espacio |
| Media | Padding desktop aplicado alrededor de lista/tabla | Reducía innecesariamente el ancho útil en pantallas pequeñas | El contenedor usa ancho completo en mobile y recupera el padding desde `md` |
| Media | Preferencias desktop persistidas podían solicitar Dashboard, Board o Calendario | Mobile podía intentar iniciar en una vista no soportada antes de resolver el estado | La política responsive se centralizó y prueba: mobile expone solo Lista/Tabla y cae a Lista |

## Comportamiento esperado

- El selector de vista ofrece únicamente Lista y Tabla cuando el viewport es
  mobile.
- Tocar o activar una fila abre una ruta de detalle de pantalla completa.
- Crear una Mission navega a `/tloz/new?kind=mission`, también de pantalla
  completa, en lugar de abrir el `SlideOver` de desktop.
- El detalle tiene una acción visible para volver al listado.
- Tabla conserva scroll horizontal deliberado; sus columnas no se comprimen
  hasta dejar datos ilegibles.
- Lista elimina metadata secundaria en mobile para evitar scroll horizontal.

## Limitaciones aceptadas

- Dashboard, Board y Calendario no se adaptaron para mobile; quedan excluidos
  por diseño en esta fase.
- Los formularios y editores internos mantienen sus capacidades actuales. La
  meta de esta fase es navegación funcional, no paridad completa con desktop.
- El sidebar mobile no se modifica porque su comportamiento actual fue
  aceptado explícitamente.

## Evidencia automatizada

`apps/dashboard/lib/tloz-routes.test.ts` cubre la política de vistas responsive,
el fallback mobile y la preservación del comportamiento desktop. Las rutas
canónicas de misión también están cubiertas en el mismo archivo.
