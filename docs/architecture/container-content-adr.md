# ADR: Container/Content sobre Supabase PostgreSQL

- Estado: Aceptado
- Fecha: 2026-07-30
- Mission: TLO-0075
- Decisión: conservar Supabase/PostgreSQL y reducir el dominio a `Container` y `Content`

## Estado de implementación

TLO-0076 introduce de forma aditiva las tablas `containers` y `contents`, el
repositorio común y las herramientas de backfill/reconciliación. Los
consumidores continúan usando `documents` y las tablas legadas hasta TLO-0077;
esta entrega no cambia rutas, UI ni fuente de lectura.

El backfill es seguro por defecto:

```bash
# Sólo calcula el plan y checksum.
pnpm --filter @tloz/data db:backfill:container-content

# Escribe mediante upsert transaccional e idempotente.
pnpm --filter @tloz/data db:backfill:container-content -- --apply

# Compara origen legado contra destino y falla si difieren.
pnpm --filter @tloz/data db:reconcile:container-content
```

Ningún comando de escritura se ejecuta automáticamente durante deploy.

## Contexto

TLOZ ya expone un contrato documental compartido, pero la persistencia conserva
varias fuentes de verdad:

- `TlozProject`, `TlozMission` y `TlozQuestItem` siguen siendo las fuentes de
  escritura de Projects, Missions e Inventory.
- `TlozDocument` replica esos registros y agrega subtablas para Project,
  Mission e Inventory.
- Los campos configurables se dividen entre definiciones, valores EAV, opciones
  de estado y definiciones de presentación JSON.
- Nueve triggers sincronizan altas, cambios, borrados, Resources y relaciones
  entre ambos modelos.
- La API v2 lee Documents, pero sus altas todavía llaman a los repositorios v1.

Agregar Workshop, Library o nuevos tipos sobre esta base ampliaría la matriz de
subtipos y compatibilidad. La diferencia entre registros debe vivir en
presentación, campos configurados y valores presentes o ausentes, no en tablas
o colecciones por tipo.

## Contrato canónico

`presentation` es una clave extensible que selecciona configuración de UI. No es
un enum de base de datos ni autoriza operaciones.

```ts
type Container = {
  id: string;
  publicId: string;
  slug?: string;
  presentation: string;
  title: string;
  summary: string;
  body: string;
  definition: {
    fields: FieldDefinition[];
    views: ViewDefinition[];
    defaultView: string;
  };
  data: Record<string, JsonValue>;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

type Content = {
  id: string;
  publicId: string;
  containerId: string;
  presentation: string;
  title: string;
  summary: string;
  body: string;
  data: Record<string, JsonValue>;
  revision: number;
  createdAt: string;
  updatedAt: string;
};
```

Invariantes:

- Cada Content pertenece a exactamente un Container.
- IDs internos, IDs públicos, revisiones y timestamps permanecen estables al
  migrar.
- Un campo ausente o `null` no se presenta; ocultarlo no elimina su valor.
- Checklist, relaciones y Resources ligados al propietario se almacenan dentro
  de `Content.data`.
- Un Resource con identidad, búsqueda o ciclo independiente es Content de un
  Container de Library o Resources.
- Los blobs continúan en Supabase Storage; Content guarda únicamente metadatos
  y referencias.
- Mutaciones requieren revisión vigente y fallan con códigos tipados. No existe
  fallback silencioso al store legacy.

## Mapa del modelo actual

| Fuente actual | Destino |
| --- | --- |
| `TlozProject` + `TlozProjectDocument` | Container con `presentation: project` |
| `TlozMission` + `TlozMissionDocument` | Content con `presentation: mission` |
| `TlozQuestItem` + `TlozInventoryDocument` | Content del Container Inventory |
| `TlozSeason` y `TlozEpisode` | Content de Containers de planeación del sistema |
| `TlozDocument` | Se sustituye por Container o Content según el registro |
| `TlozDocumentDefinition`, `TlozFieldDefinition`, `TlozStatusOption` | `Container.definition` |
| `TlozFieldValue` | `Content.data` |
| `TlozMissionDependency`, `TlozMissionQuestItem`, `TlozDocumentRelation` | Referencias tipadas en `Content.data.relations` |
| `TlozChecklistItem` | `Content.data.checklist` |
| `TlozResource` ligado a propietario | `Container.data.resources` o `Content.data.resources` |
| `TlozResource` compartido | Content de Library/Resources |
| `TlozAttachmentBatch` | Estado operativo temporal; al finalizar, metadatos en el propietario |
| `TlozUserMissionState` | Persistencia de plataforma asociada al usuario |
| Users, Sessions, API Keys y Avatars | Permanecen como persistencia de plataforma |

Los triggers `tloz_*_document_sync`, `tloz_*_document_delete` y los de
sincronización de Resources/relaciones sólo existen durante la ventana de
compatibilidad. El estado final no conserva doble escritura.

## Caminos evaluados

### Supabase/PostgreSQL

El modelo físico usa dos tablas:

- `containers`: columnas estables más `definition JSONB` y `data JSONB`.
- `contents`: columnas estables, FK a Container y `data JSONB`.

Los índices B-tree cubren identidad, Container, presentación y orden. GIN e
índices de expresión se añaden únicamente para filtros demostrados. PostgreSQL
permite indexar contenido JSONB completo o expresiones concretas:
[documentación oficial](https://www.postgresql.org/docs/17/datatype-json.html).

### MongoDB Atlas

El modelo físico usa las colecciones `containers` y `contents`, validadores JSON
Schema e índices equivalentes. Identidad, sesiones y blobs continuarían en
Supabase, por lo que TLOZ operaría dos stores, dos conexiones y referencias sin
FK entre servicios.

MongoDB mantiene un esquema flexible, pero recomienda diseñar el modelo y
aplicar validación:
[modelado](https://www.mongodb.com/docs/manual/data-modeling/) y
[validación](https://www.mongodb.com/docs/manual/core/schema-validation/).
Las transacciones multi-documento están disponibles, aunque tienen mayor costo
que las escrituras atómicas de un documento:
[transacciones](https://www.mongodb.com/docs/manual/core/transactions/).

## Evidencia reproducible

Comando local:

```bash
pnpm --filter @tloz/data poc:container-content
```

El runner inicia `postgres:17-alpine` y `mongo:8.0` en contenedores efímeros,
ejecuta la misma migración dos veces, valida checksum, referencias, revisión
optimista y rollback, genera 5,000 registros sintéticos y elimina ambos
contenedores al terminar.

Resultados del 2026-07-30:

| Evidencia | PostgreSQL 17.10 | MongoDB 8.0.28 |
| --- | ---: | ---: |
| Paridad de fixtures y errores | Sí | Sí |
| Checksum canónico | `0ba82e…511ad3b` | `0ba82e…511ad3b` |
| Migración idempotente y rollback | Sí | Sí |
| Ensayo de corte | 1,981.734 ms | 8,710.415 ms |
| p95, filtro+orden+limit sobre 5,000 registros | 0.161 ms | 5.004 ms |
| Integridad Container→Content | FK | Validación de aplicación |

El baseline sintético que reproduce el join `Document` +
`MissionDocument` obtuvo 0.410 ms p95. El límite acordado fue 0.492 ms
(baseline +20%): JSONB lo cumple y Mongo no. Estos números prueban el diseño y
los índices en local; no representan latencia de red ni sustituyen el ensayo
con el volumen completo antes del corte de producción.

La suite unitaria común agrega cobertura de campos nulos/ocultos, custom fields,
Markdown, checklist, Resources, referencias inválidas, conflicto de revisión,
indisponibilidad, checksum y restauración.

## Decisión

Se elige Supabase/PostgreSQL.

Ambos motores pueden representar el contrato, pero PostgreSQL es
materialmente más simple para TLOZ:

| Señal de simplicidad | PostgreSQL | MongoDB |
| --- | --- | --- |
| Stores operativos | Supabase existente | Supabase + Atlas |
| Credenciales, backup y monitoreo nuevos | Ninguno | Un servicio completo |
| Integridad Container→Content | FK nativa | Lógica de aplicación |
| Identidad y Storage | Mismo entorno | Referencias entre stores |
| Driver y despliegue | Evolución del stack actual | Driver y conexión adicionales |
| Migración | Aditiva dentro de PostgreSQL | Exportación, importación y corte entre servicios |
| Rendimiento del PoC | Cumple gate | No cumple gate relativo |

MongoDB no ofrece una reducción de modelos: ambos caminos terminan con dos
stores canónicos. Su flexibilidad no compensa la segunda infraestructura ni la
integridad adicional en aplicación.

## API y migración

La ejecución se divide en cuatro Missions:

1. Crear el store Container/Content en Supabase y su repositorio canónico.
2. Backfillear y migrar UI/Data API v2 a `/api/v2/containers` y
   `/api/v2/contents`; v1 queda como adaptador deprecado.
3. Ejecutar un corte read-only: bloquear escrituras, ejecutar backfill
   idempotente, comparar conteos/checksums/referencias, cambiar la fuente
   canónica y ejecutar smoke tests.
4. Después de una versión completa, retirar v1, tablas legacy, EAV, subtipos y
   triggers mediante una migración nueva. Las migraciones históricas nunca se
   eliminan ni reescriben.

El corte se aborta ante cualquier diferencia y mantiene el modelo actual como
fuente de verdad. El rollback cambia el feature flag al repositorio anterior y
restaura el snapshot verificado antes de reabrir escrituras. No se mantiene
dual-write de forma indefinida.

## Consecuencias

- Workshop y Library se implementan como configuraciones de
  Container/Content, no como tablas ni `kind` físicos.
- TLO-0014 optimiza consultas del repositorio ganador, no el espejo actual.
- Change feed e import/export se diseñan después del corte canónico.
- La API v2 cambia intencionalmente; todos sus consumidores del repositorio se
  migran en el mismo ciclo. v1 conserva una ventana de compatibilidad de una
  versión.
- El prototipo no modifica el runtime ni la base de producción.
