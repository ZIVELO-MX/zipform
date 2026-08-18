# TLO-0072 · Grupos de capturas en Recursos

## Decisiones implementadas

- `groupName` es opcional y lo define el cliente en el manifiesto existente de Attachments.
- El manifiesto se conserva en la columna JSON actual; no se agregó ni modificó ninguna migración.
- Los lotes históricos cuyo manifiesto es un arreglo siguen siendo válidos.
- Cuando no existe `groupName`, la interfaz genera un nombre legible desde `groupKey`.
- Mission Detail muestra un solo item por grupo y firma sus lecturas únicamente al abrir la preview.
- La carga web permanece detrás de `MISSION_ATTACHMENT_UPLOAD_UI_ENABLED = false`.

## Pendiente antes de activar la carga web

- Ejecutar el pipeline completo y el preview del PR.
- Validar en el preview, con una sesión que pueda actualizar la Mission, preparación, progreso, fallo parcial, reintento y reemplazo.
- Repetir la validación en viewport móvil, desktop, teclado y zoom de texto al 200%.
- Confirmar que una sesión de sólo lectura conserva la preview y no muestra controles de mutación.
- Activar la bandera únicamente después de esas verificaciones; no requiere migración.

## Evidencia local disponible

- Typecheck de `@tloz/data` y `@tloz/dashboard`: correcto.
- Suites completas locales: 86/86 pruebas de `@tloz/data` y 222/222 de `@tloz/dashboard`.
- Build de producción de Next.js: correcto.
- React Doctor: 39/100, 138 hallazgos globales. Los cuatro hallazgos del flujo de Attachments detectados durante esta misión fueron corregidos; los siete errores restantes pertenecen a acciones/documentos, `next-auth` y Mission Slide Over fuera de TLO-0072.
- `verify:openapi` local requiere `VERCEL_AUTOMATION_BYPASS_SECRET`; su resultado queda para el pipeline del PR y no se modificó ningún secreto.
- La automatización visual con Playwright queda pendiente de preview: esta sesión no dispone del conector del navegador ni de un binario Chromium local, y no se descargó software como parte de la misión.

## Información del cliente pendiente

No falta contenido, naming ni una decisión funcional del cliente para entregar la visualización API-only. La única decisión posterior es operativa: autorizar la activación de la carga web cuando el preview y su pipeline estén verdes.
