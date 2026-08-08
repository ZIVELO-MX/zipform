import { Prisma, type PrismaClient } from "@prisma/client";
import type {
  TlozDocument,
  TlozDocumentDefinition,
  TlozDocumentPresentationField,
  TlozDocumentScalar,
  TlozDocumentUpdate,
  TlozDocumentViewDefinition,
  TlozFieldDefinition,
  TlozFieldOption,
} from "@tloz/types";
import type {
  DocumentFilters,
  DocumentGetOptions,
  PaginatedResult,
  PaginationInput,
  TlozDocumentRepository,
} from "../contracts";
import { validateDocumentProperties, validateProjectFields } from "../document-contract";
import { TlozDocumentError } from "../document-errors";
import { parseMarkdownChecklist } from "../tloz-hydration";

const documentInclude = {
  project: {
    include: {
      projectDocument: {
        include: {
          fieldDefinitions: {
            where: { retiredAt: null },
            orderBy: { position: "asc" as const },
          },
        },
      },
    },
  },
  projectDocument: {
    include: {
      fieldDefinitions: {
        where: { retiredAt: null },
        orderBy: { position: "asc" as const },
      },
    },
  },
  missionDocument: true,
  inventoryDocument: true,
  fieldValues: {
    include: {
      fieldDefinition: true,
    },
  },
  _count: {
    select: { children: true },
  },
} satisfies Prisma.TlozDocumentInclude;

type DocumentRow = Prisma.TlozDocumentGetPayload<{ include: typeof documentInclude }>;
const definitionInclude = {
  ownerDocument: {
    include: {
      projectDocument: {
        include: {
          fieldDefinitions: {
            where: { retiredAt: null },
            orderBy: { position: "asc" as const },
          },
        },
      },
    },
  },
} satisfies Prisma.TlozDocumentDefinitionInclude;
type DefinitionRow = Prisma.TlozDocumentDefinitionGetPayload<{
  include: typeof definitionInclude;
}>;

export function createPrismaDocumentRepository(prisma: PrismaClient): TlozDocumentRepository {
  async function get(
    documentId: string,
    options: DocumentGetOptions = {},
  ): Promise<TlozDocument | null> {
    const row = await prisma.tlozDocument.findFirst({
      where: documentReferenceWhere(documentId),
      include: documentInclude,
    });
    if (!row) return null;
    const document = mapDocument(row);
    if (!options.includeChildren) return document;

    const limit = Math.min(Math.max(options.childrenPagination?.limit ?? 25, 1), 100);
    const [children, total] = await Promise.all([
      prisma.tlozDocument.findMany({
        where: { projectId: row.id },
        include: documentInclude,
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
        take: limit + 1,
        ...(options.childrenPagination?.cursor && isUuid(options.childrenPagination.cursor)
          ? { cursor: { id: options.childrenPagination.cursor }, skip: 1 }
          : {}),
      }),
      prisma.tlozDocument.count({ where: { projectId: row.id } }),
    ]);
    const data = children.slice(0, limit).map(mapDocument);
    return {
      ...document,
      children: {
        data,
        nextCursor: children.length > limit ? data.at(-1)?.id ?? null : null,
        total,
      },
    };
  }

  return {
    async find(filters: DocumentFilters = {}, pagination: PaginationInput = {}): Promise<PaginatedResult<TlozDocument>> {
      const limit = Math.min(Math.max(pagination.limit ?? 25, 1), 100);
      const projectReference = filters.projectId
        ? documentReferenceWhere(filters.projectId)
        : filters.parentId
          ? documentReferenceWhere(filters.parentId)
          : undefined;
      const rows = await prisma.tlozDocument.findMany({
        where: {
          ...(filters.kind ? { kind: filters.kind } : {}),
          ...(!filters.includeSystem ? {
            publicId: { notIn: ["project-inventory", "project-unassigned"] },
          } : {}),
          ...(projectReference ? {
            project: { is: projectReference },
          } : {}),
          ...(filters.query ? {
            AND: [{
              OR: [
                { publicId: { contains: filters.query, mode: "insensitive" } },
                { title: { contains: filters.query, mode: "insensitive" } },
                { summary: { contains: filters.query, mode: "insensitive" } },
              ],
            }],
          } : {}),
        },
        include: documentInclude,
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
        take: limit + 1,
        ...(pagination.cursor && isUuid(pagination.cursor)
          ? { cursor: { id: pagination.cursor }, skip: 1 }
          : {}),
      });
      const data = rows.slice(0, limit).map(mapDocument);
      return {
        data,
        nextCursor: rows.length > limit ? data.at(-1)?.id ?? null : null,
      };
    },
    get,
    async getDefinition(definitionKey: string) {
      let row = await prisma.tlozDocumentDefinition.findUnique({
        where: { key: definitionKey },
        include: definitionInclude,
      });
      if (!row && definitionKey.endsWith(":children")) {
        const ownerReference = definitionKey.slice(0, -":children".length);
        row = await prisma.tlozDocumentDefinition.findFirst({
          where: {
            scope: "children",
            ownerDocument: { is: documentReferenceWhere(ownerReference) },
          },
          include: definitionInclude,
        });
      }
      if (!row) return null;
      return mapDefinition(row);
    },
    async update(documentId: string, input: TlozDocumentUpdate, expectedRevision: number) {
      const current = await prisma.tlozDocument.findFirst({
        where: documentReferenceWhere(documentId),
        include: documentInclude,
      });
      if (!current) throw notFound(documentId);
      assertRevision(current.revision, expectedRevision);
      if (input.title !== undefined && !input.title.trim()) {
        throw new TlozDocumentError("DOCUMENT_INVALID", "El título no puede estar vacío.", {
          title: "required",
        });
      }
      if (input.properties) {
        const fields = current.kind === "project"
          ? []
          : current.project?.projectDocument?.fieldDefinitions.map(mapFieldDefinition) ?? [];
        validateDocumentProperties(
          fields,
          input.properties,
          current.kind as TlozDocument["kind"],
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('tloz.sync_origin', 'document', true)`;
        const updated = await tx.tlozDocument.updateMany({
          where: { id: current.id, revision: expectedRevision },
          data: {
            ...(input.title === undefined ? {} : { title: input.title.trim() }),
            ...(input.summary === undefined ? {} : { summary: input.summary.trim() }),
            ...(input.body === undefined ? {} : { body: input.body.trim() }),
            revision: { increment: 1 },
            updatedAt: new Date(),
          },
        });
        if (updated.count !== 1) throw revisionConflict(expectedRevision);

        await updateLegacySource(tx, current, input);
        await updateTypedProperties(tx, current, input.properties ?? {});
        await updateMissionBodyProjection(tx, current, input.body);
      });

      const document = await get(current.id);
      if (!document) throw notFound(current.id);
      return document;
    },
    async replaceProjectContract(projectId: string, fields: TlozFieldDefinition[], expectedRevision: number) {
      const current = await prisma.tlozDocument.findFirst({
        where: documentReferenceWhere(projectId),
        include: documentInclude,
      });
      if (!current) throw notFound(projectId);
      if (current.kind !== "project" || !current.projectDocument) {
        throw new TlozDocumentError("DOCUMENT_INVALID", "Solo un project puede definir un contrato.", {
          kind: "invalid",
        });
      }
      assertRevision(current.revision, expectedRevision);
      const validated = validateProjectFields(fields);

      await prisma.$transaction(async (tx) => {
        const updated = await tx.tlozDocument.updateMany({
          where: { id: current.id, revision: expectedRevision },
          data: { revision: { increment: 1 }, updatedAt: new Date() },
        });
        if (updated.count !== 1) throw revisionConflict(expectedRevision);

        const activeKeys = validated.map((field) => field.key);
        await tx.tlozFieldDefinition.updateMany({
          where: {
            projectId: current.id,
            ...(activeKeys.length ? { key: { notIn: activeKeys } } : {}),
            retiredAt: null,
          },
          data: { retiredAt: new Date() },
        });
        for (const field of validated) {
          await tx.tlozFieldDefinition.upsert({
            where: { projectId_key: { projectId: current.id, key: field.key } },
            create: {
              id: isUuid(field.id) ? field.id : crypto.randomUUID(),
              projectId: current.id,
              key: field.key,
              label: field.label,
              fieldType: field.type,
              required: field.required,
              visible: field.visible,
              position: field.position,
              defaultValue: toJsonInput(field.defaultValue),
              options: toJsonInput(field.options),
            },
            update: {
              label: field.label,
              fieldType: field.type,
              required: field.required,
              visible: field.visible,
              position: field.position,
              defaultValue: toNullableJsonInput(field.defaultValue),
              options: toNullableJsonInput(field.options),
              retiredAt: null,
            },
          });
        }

        const statusField = validated.find((field) => field.key === "status");
        const statusOptions = statusField?.options.filter((option) => option.role) ?? [];
        if (statusOptions.length) {
          await tx.tlozStatusOption.updateMany({
            where: { projectId: current.id },
            data: { active: false },
          });
          for (const [position, option] of statusOptions.entries()) {
            await tx.tlozStatusOption.upsert({
              where: { projectId_key: { projectId: current.id, key: option.value } },
              create: {
                id: crypto.randomUUID(),
                projectId: current.id,
                key: option.value,
                label: option.label,
                role: option.role!,
                color: option.color,
                position,
                active: true,
              },
              update: {
                label: option.label,
                role: option.role!,
                color: option.color,
                position,
                active: true,
              },
            });
          }
        }
      });

      const document = await get(current.id);
      if (!document) throw notFound(current.id);
      return document;
    },
    async delete(documentId: string, expectedRevision: number) {
      const current = await prisma.tlozDocument.findFirst({
        where: documentReferenceWhere(documentId),
        include: documentInclude,
      });
      if (!current) throw notFound(documentId);
      if (!current.sourceType || !current.sourceId) {
        throw new TlozDocumentError("DOCUMENT_INVALID", "Los Projects de sistema no se pueden eliminar.");
      }
      const sourceType = current.sourceType;
      const sourceId = current.sourceId;
      assertRevision(current.revision, expectedRevision);

      await prisma.$transaction(async (tx) => {
        const claimed = await tx.tlozDocument.updateMany({
          where: { id: current.id, revision: expectedRevision },
          data: { revision: { increment: 1 } },
        });
        if (claimed.count !== 1) throw revisionConflict(expectedRevision);
        if (sourceType === "project") {
          const children = await tx.tlozDocument.count({ where: { projectId: current.id } });
          if (children > 0) {
            throw new TlozDocumentError("DOCUMENT_INVALID", "El Project conserva documentos y no se puede eliminar.");
          }
          await tx.tlozResource.deleteMany({ where: { projectId: sourceId } });
          await tx.tlozProject.delete({ where: { id: sourceId } });
        } else if (sourceType === "mission") {
          await tx.tlozUserMissionState.deleteMany({ where: { missionId: sourceId } });
          await tx.tlozResource.deleteMany({ where: { missionId: sourceId } });
          await tx.tlozChecklistItem.deleteMany({ where: { missionId: sourceId } });
          await tx.tlozMissionQuestItem.deleteMany({ where: { missionId: sourceId } });
          await tx.tlozMissionDependency.deleteMany({
            where: {
              OR: [
                { missionId: sourceId },
                { dependsOnMissionId: sourceId },
              ],
            },
          });
          await tx.tlozMission.delete({ where: { id: sourceId } });
        } else {
          await tx.tlozResource.deleteMany({ where: { questItemId: sourceId } });
          await tx.tlozMissionQuestItem.deleteMany({ where: { questItemId: sourceId } });
          await tx.tlozQuestItem.delete({ where: { id: sourceId } });
        }
      });
    },
  };
}

function mapDocument(row: DocumentRow): TlozDocument {
  const builtIn = row.projectDocument
    ? compact({
      status: row.projectDocument.status,
      category: row.projectDocument.projectType,
      owner: row.projectDocument.ownerId,
      color: row.projectDocument.color,
      icon: row.projectDocument.icon,
      start: row.projectDocument.startDate,
      due: row.projectDocument.dueDate,
    })
    : row.missionDocument
      ? compact({
        status: row.missionDocument.status,
        category: row.missionDocument.category,
        assignee: row.missionDocument.ownerId,
        icon: row.missionDocument.icon,
        start: row.missionDocument.startDate,
        due: row.missionDocument.dueDate,
        progress: row.missionDocument.progress,
        blocked_reason: row.missionDocument.blockedReason,
      })
      : row.inventoryDocument
        ? compact({
          status: row.inventoryDocument.status,
          category: row.inventoryDocument.category,
          assignee: row.inventoryDocument.ownerId,
          icon: row.inventoryDocument.icon,
          acquired: row.inventoryDocument.acquiredAt,
        })
        : {};
  if (row.projectDocument) builtIn.mission_count = row._count.children;
  const values = Object.fromEntries(
    row.fieldValues
      .filter((value) => value.fieldDefinition.projectId === (
        row.kind === "project" ? row.id : row.projectId
      ))
      .map((value) => [
        value.fieldDefinition.key,
        mapFieldValue(value),
      ]),
  );
  const projectSlug = row.projectDocument?.slug ?? row.project?.projectDocument?.slug;
  const fields = row.projectDocument?.fieldDefinitions.map(mapFieldDefinition);

  const inventoryRoot = row.kind === "inventory" && row.project?.publicId === "project-inventory";
  return {
    id: row.id,
    publicId: row.publicId,
    kind: row.kind as TlozDocument["kind"],
    parentId: inventoryRoot ? undefined : row.projectId ?? undefined,
    parentPublicId: inventoryRoot ? undefined : row.project?.publicId,
    projectSlug: inventoryRoot ? undefined : projectSlug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    revision: row.revision,
    properties: { ...builtIn, ...values },
    ...(fields ? { contract: { projectId: row.publicId, fields } } : {}),
    ...(row.sourceType && row.sourceId
      ? { source: { type: row.sourceType as TlozDocument["kind"], id: row.sourceId } }
      : {}),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapDefinition(row: DefinitionRow): TlozDocumentDefinition {
  const storedFields = parsePresentationFields(row.fields);
  const contractFields = row.ownerDocument?.projectDocument?.fieldDefinitions.map((field) => ({
    key: field.key,
    label: field.label,
    format: field.fieldType === "date"
      ? "date" as const
      : field.fieldType === "number"
        ? "number" as const
        : field.key === "status"
          ? "status" as const
          : field.fieldType === "person"
            ? "person" as const
            : "text" as const,
    position: field.position,
    visible: field.visible,
    options: fromJsonOptions(field.options),
  })) ?? [];
  const fields = row.scope === "children"
    ? mergePresentationFields([
      { key: "publicId", label: "ID", format: "id", position: 0, visible: true },
      { key: "title", label: "Mission", format: "text", position: 1, visible: true },
      ...contractFields.map((field) => ({ ...field, position: field.position + 2 })),
      { key: "assignee", label: "Responsable", format: "person", position: 100, visible: true },
      { key: "start", label: "Inicio", format: "date", position: 101, visible: true },
      { key: "due", label: "Vence", format: "date", position: 102, visible: true },
      { key: "progress", label: "Progreso", format: "number", position: 103, visible: true },
      { key: "blocked_reason", label: "Bloqueo", format: "text", position: 104, visible: true },
    ])
    : storedFields;
  const views = parseViewDefinitions(row.views);
  if (!["project", "mission", "inventory"].includes(row.kind)
    || !["collection", "children"].includes(row.scope)
    || !views.some((view) => view.id === row.defaultView)) {
    throw new TlozDocumentError(
      "DOCUMENT_INVALID",
      `La definición ${row.key} no es válida.`,
    );
  }
  return {
    id: row.id,
    key: row.key,
    kind: row.kind as TlozDocumentDefinition["kind"],
    scope: row.scope as TlozDocumentDefinition["scope"],
    ...(row.ownerDocumentId ? { ownerDocumentId: row.ownerDocumentId } : {}),
    fields,
    views,
    defaultView: row.defaultView as TlozDocumentDefinition["defaultView"],
  };
}

function mergePresentationFields(
  fields: TlozDocumentPresentationField[],
): TlozDocumentPresentationField[] {
  const byKey = new Map<string, TlozDocumentPresentationField>();
  for (const field of fields) byKey.set(field.key, field);
  return [...byKey.values()].sort((left, right) => left.position - right.position);
}

function parsePresentationFields(value: Prisma.JsonValue): TlozDocumentPresentationField[] {
  const formats = new Set(["text", "status", "date", "person", "number", "id"]);
  if (!Array.isArray(value) || value.some((field) => (
    typeof field !== "object"
    || field === null
    || Array.isArray(field)
    || typeof field.key !== "string"
    || typeof field.label !== "string"
    || typeof field.position !== "number"
    || typeof field.visible !== "boolean"
    || typeof field.format !== "string"
    || !formats.has(field.format)
  ))) {
    throw new TlozDocumentError("DOCUMENT_INVALID", "La configuración fields no es válida.");
  }
  return value as TlozDocumentPresentationField[];
}

function parseViewDefinitions(value: Prisma.JsonValue): TlozDocumentViewDefinition[] {
  const views = new Set(["dashboard", "list", "board", "table", "calendar", "detail"]);
  if (!Array.isArray(value) || value.some((view) => (
    typeof view !== "object"
    || view === null
    || Array.isArray(view)
    || typeof view.id !== "string"
    || !views.has(view.id)
    || !Array.isArray(view.fields)
    || !view.fields.every((field) => typeof field === "string")
  ))) {
    throw new TlozDocumentError("DOCUMENT_INVALID", "La configuración views no es válida.");
  }
  return value as TlozDocumentViewDefinition[];
}

function mapFieldDefinition(
  field: DocumentRow["projectDocument"] extends infer _T
    ? NonNullable<DocumentRow["projectDocument"]>["fieldDefinitions"][number]
    : never,
): TlozFieldDefinition {
  return {
    id: field.id,
    key: field.key,
    label: field.label,
    type: field.fieldType as TlozFieldDefinition["type"],
    required: field.required,
    visible: field.visible,
    position: field.position,
    ...(field.defaultValue === null ? {} : { defaultValue: fromJsonScalar(field.defaultValue) }),
    options: fromJsonOptions(field.options),
  };
}

function mapFieldValue(value: DocumentRow["fieldValues"][number]): TlozDocumentScalar {
  switch (value.fieldDefinition.fieldType) {
    case "number":
      return value.numberValue === null ? null : Number(value.numberValue);
    case "boolean":
      return value.booleanValue;
    case "date":
      return value.dateValue?.toISOString().slice(0, 10) ?? null;
    case "multiselect":
      return value.stringListValue;
    case "person":
      return value.personId;
    case "relation":
      return value.relatedDocumentId;
    default:
      return value.stringValue;
  }
}

async function updateLegacySource(
  tx: Prisma.TransactionClient,
  current: DocumentRow,
  input: TlozDocumentUpdate,
) {
  const properties = input.properties ?? {};
  if (!current.sourceType || !current.sourceId) {
    if (current.projectDocument) {
      const projectProperties = projectDocumentProperties(properties);
      if (Object.keys(projectProperties).length) {
        await tx.tlozProjectDocument.updateMany({
          where: { documentId: current.id },
          data: projectProperties,
        });
      }
    }
    return;
  }
  if (current.sourceType === "project") {
    const projectProperties = projectDocumentProperties(properties);
    await tx.tlozProject.updateMany({
      where: { id: current.sourceId },
      data: {
        ...(input.title === undefined ? {} : { name: input.title.trim() }),
        ...(input.summary === undefined ? {} : { description: input.summary.trim() }),
        ...(input.body === undefined ? {} : { descriptionDetail: input.body.trim() }),
        ...(typeof properties.status === "string" ? { status: properties.status } : {}),
        ...(typeof properties.category === "string" ? { type: properties.category } : {}),
        ...(typeof properties.owner === "string" ? { ownerId: properties.owner } : {}),
        ...(typeof properties.color === "string" ? { color: properties.color } : {}),
        ...(typeof properties.icon === "string" ? { icon: properties.icon } : {}),
        ...(typeof properties.start === "string" ? { startDate: properties.start } : {}),
        ...(properties.due === null || typeof properties.due === "string" ? { dueDate: properties.due } : {}),
        updatedAt: new Date(),
      },
    });
    if (Object.keys(projectProperties).length) {
      await tx.tlozProjectDocument.updateMany({
        where: { documentId: current.id },
        data: projectProperties,
      });
    }
  } else if (current.sourceType === "mission") {
    const missionProperties = {
      ...(typeof properties.status === "string" ? { status: properties.status } : {}),
      ...(typeof properties.category === "string" ? { category: properties.category } : {}),
      ...(typeof properties.assignee === "string" ? { ownerId: properties.assignee } : {}),
      ...(typeof properties.icon === "string" ? { icon: properties.icon } : {}),
      ...(properties.start === null || typeof properties.start === "string" ? { startDate: properties.start } : {}),
      ...(properties.due === null || typeof properties.due === "string" ? { dueDate: properties.due } : {}),
      ...(typeof properties.progress === "number" ? { progress: properties.progress } : {}),
      ...(properties.blocked_reason === null || typeof properties.blocked_reason === "string"
        ? { blockedReason: properties.blocked_reason }
        : {}),
    };
    await tx.tlozMission.updateMany({
      where: { id: current.sourceId },
      data: {
        ...(input.title === undefined ? {} : { title: input.title.trim() }),
        ...(input.summary === undefined ? {} : { description: input.summary.trim() }),
        ...(input.body === undefined ? {} : { descriptionDetail: input.body.trim() }),
        ...(typeof properties.status === "string" ? { status: properties.status } : {}),
        ...(typeof properties.category === "string" ? { type: properties.category } : {}),
        ...(typeof properties.assignee === "string" ? { ownerId: properties.assignee } : {}),
        ...(typeof properties.icon === "string" ? { icon: properties.icon } : {}),
        ...(properties.start === null || typeof properties.start === "string" ? { startDate: properties.start } : {}),
        ...(properties.due === null || typeof properties.due === "string" ? { dueDate: properties.due } : {}),
        ...(typeof properties.progress === "number" ? { progress: properties.progress } : {}),
        ...(properties.blocked_reason === null || typeof properties.blocked_reason === "string"
          ? { blockedReason: properties.blocked_reason }
          : {}),
        updatedAt: new Date(),
      },
    });
    if (Object.keys(missionProperties).length) {
      await tx.tlozMissionDocument.updateMany({
        where: { documentId: current.id },
        data: missionProperties,
      });
    }
  } else if (current.sourceType === "inventory") {
    const inventoryProperties = {
      ...(typeof properties.status === "string" ? { status: properties.status } : {}),
      ...(typeof properties.category === "string" ? { category: properties.category } : {}),
      ...(properties.assignee === null || typeof properties.assignee === "string"
        ? { ownerId: properties.assignee }
        : {}),
      ...(typeof properties.icon === "string" ? { icon: properties.icon } : {}),
      ...(properties.acquired === null || typeof properties.acquired === "string"
        ? { acquiredAt: properties.acquired }
        : {}),
    };
    await tx.tlozQuestItem.updateMany({
      where: { id: current.sourceId },
      data: {
        ...(input.title === undefined ? {} : { name: input.title.trim() }),
        ...(input.summary === undefined ? {} : { description: input.summary.trim() }),
        ...(input.body === undefined ? {} : { descriptionDetail: input.body.trim() }),
        ...(typeof properties.status === "string" ? { status: properties.status } : {}),
        ...(typeof properties.category === "string" ? { category: properties.category } : {}),
        ...(properties.assignee === null || typeof properties.assignee === "string"
          ? { ownerId: properties.assignee }
          : {}),
        ...(typeof properties.icon === "string" ? { icon: properties.icon } : {}),
        ...(properties.acquired === null || typeof properties.acquired === "string"
          ? { acquiredAt: properties.acquired }
          : {}),
        updatedAt: new Date(),
      },
    });
    if (Object.keys(inventoryProperties).length) {
      await tx.tlozInventoryDocument.updateMany({
        where: { documentId: current.id },
        data: inventoryProperties,
      });
    }
  }
}

async function updateMissionBodyProjection(
  tx: Prisma.TransactionClient,
  current: DocumentRow,
  body: string | undefined,
) {
  if (body === undefined || !current.missionDocument) return;
  const checklist = parseMarkdownChecklist(body);
  const progress = checklist.length
    ? Math.round((checklist.filter((item) => item.completed).length / checklist.length) * 100)
    : 0;
  if (current.sourceId) {
    await tx.tlozChecklistItem.deleteMany({
      where: { missionId: current.sourceId },
    });
    await Promise.all(checklist.map((item, position) => tx.tlozChecklistItem.create({
      data: {
        id: crypto.randomUUID(),
        missionId: current.sourceId!,
        title: item.title,
        completed: item.completed,
        position,
      },
    })));
    await tx.tlozMission.updateMany({
      where: { id: current.sourceId },
      data: { progress },
    });
  }
  await tx.tlozMissionDocument.update({
    where: { documentId: current.id },
    data: { progress },
  });
}

function projectDocumentProperties(properties: Record<string, TlozDocumentScalar>) {
  return {
    ...(typeof properties.status === "string" ? { status: properties.status } : {}),
    ...(typeof properties.category === "string" ? { projectType: properties.category } : {}),
    ...(typeof properties.owner === "string" ? { ownerId: properties.owner } : {}),
    ...(typeof properties.color === "string" ? { color: properties.color } : {}),
    ...(typeof properties.icon === "string" ? { icon: properties.icon } : {}),
    ...(typeof properties.start === "string" ? { startDate: properties.start } : {}),
    ...(properties.due === null || typeof properties.due === "string" ? { dueDate: properties.due } : {}),
  };
}

async function updateTypedProperties(
  tx: Prisma.TransactionClient,
  current: DocumentRow,
  properties: Record<string, TlozDocumentScalar>,
) {
  const definitions = await tx.tlozFieldDefinition.findMany({
    where: { projectId: current.kind === "project" ? current.id : current.projectId!, retiredAt: null },
  });
  const definitionsByKey = new Map(definitions.map((definition) => [definition.key, definition]));
  const systemKeys = new Set([
    "owner",
    "assignee",
    "color",
    "icon",
    "start",
    "due",
    "progress",
    "blocked_reason",
    "acquired",
  ]);

  for (const [key, value] of Object.entries(properties)) {
    if (current.projectDocument && (key === "status" || key === "category")) {
      continue;
    }
    const definition = definitionsByKey.get(key);
    if (!definition) {
      if (systemKeys.has(key)) continue;
      throw new TlozDocumentError("DOCUMENT_INVALID", `El campo ${key} no pertenece al contrato.`, {
        [`properties.${key}`]: "unknown",
      });
    }
    const typed = await fieldValueData(tx, definition, value, key);
    await tx.tlozFieldValue.upsert({
      where: {
        documentId_fieldDefinitionId: {
          documentId: current.id,
          fieldDefinitionId: definition.id,
        },
      },
      create: {
        id: crypto.randomUUID(),
        documentId: current.id,
        fieldDefinitionId: definition.id,
        ...typed,
      },
      update: typed,
    });

    if (key === "status" && typeof value === "string") {
      if (current.missionDocument) {
        const status = fromJsonOptions(definition.options).find((option) => option.value === value);
        const completedAt = status?.role === "done" ? new Date() : null;
        await Promise.all([
          tx.tlozMissionDocument.update({
            where: { documentId: current.id },
            data: { status: value, completedAt },
          }),
          current.sourceId
            ? tx.tlozMission.updateMany({
              where: { id: current.sourceId },
              data: { completedAt },
            })
            : Promise.resolve(),
        ]);
      } else if (current.inventoryDocument) {
        await tx.tlozInventoryDocument.update({ where: { documentId: current.id }, data: { status: value } });
      } else if (current.projectDocument) {
        await tx.tlozProjectDocument.update({ where: { documentId: current.id }, data: { status: value } });
      }
    }
    if (key === "category" && typeof value === "string") {
      if (current.missionDocument) {
        await tx.tlozMissionDocument.update({ where: { documentId: current.id }, data: { category: value } });
      } else if (current.inventoryDocument) {
        await tx.tlozInventoryDocument.update({ where: { documentId: current.id }, data: { category: value } });
      } else if (current.projectDocument) {
        await tx.tlozProjectDocument.update({ where: { documentId: current.id }, data: { projectType: value } });
      }
    }
  }
}

async function fieldValueData(
  tx: Prisma.TransactionClient,
  definition: {
    fieldType: string;
    options: Prisma.JsonValue | null;
  },
  value: TlozDocumentScalar,
  key: string,
) {
  const base = {
    stringValue: null,
    numberValue: null,
    booleanValue: null,
    dateValue: null,
    stringListValue: [] as string[],
    personId: null,
    relatedDocumentId: null,
    updatedAt: new Date(),
  };
  if (value === null) return base;
  const invalid = () => new TlozDocumentError("DOCUMENT_INVALID", `El valor de ${key} no coincide con su tipo.`, {
    [`properties.${key}`]: "invalid",
  });
  switch (definition.fieldType) {
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) throw invalid();
      return { ...base, numberValue: value };
    case "boolean":
      if (typeof value !== "boolean") throw invalid();
      return { ...base, booleanValue: value };
    case "date": {
      if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw invalid();
      const date = new Date(`${value}T00:00:00.000Z`);
      if (Number.isNaN(date.valueOf())) throw invalid();
      return { ...base, dateValue: date };
    }
    case "multiselect": {
      if (!Array.isArray(value)) throw invalid();
      assertOptions(value, definition.options, invalid);
      return { ...base, stringListValue: value };
    }
    case "person":
      if (typeof value !== "string" || !isUuid(value)) throw invalid();
      return { ...base, personId: value };
    case "relation": {
      if (typeof value !== "string") throw invalid();
      const related = await tx.tlozDocument.findFirst({
        where: documentReferenceWhere(value),
        select: { id: true },
      });
      if (!related) throw invalid();
      return { ...base, relatedDocumentId: related.id };
    }
    case "select":
      if (typeof value !== "string") throw invalid();
      assertOptions([value], definition.options, invalid);
      return { ...base, stringValue: value };
    case "text":
      if (typeof value !== "string") throw invalid();
      return { ...base, stringValue: value };
    default:
      throw invalid();
  }
}

function assertOptions(values: string[], rawOptions: Prisma.JsonValue | null, invalid: () => Error) {
  const options = fromJsonOptions(rawOptions);
  if (!values.every((value) => options.some((option) => option.value === value))) throw invalid();
}

function documentReferenceWhere(documentId: string): Prisma.TlozDocumentWhereInput {
  return isUuid(documentId)
    ? { OR: [{ id: documentId }, { publicId: documentId }, { sourceId: documentId }] }
    : { OR: [{ publicId: documentId }, { sourceId: documentId }] };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function compact(values: Record<string, TlozDocumentScalar | undefined>) {
  return Object.fromEntries(
    Object.entries(values).filter((entry): entry is [string, TlozDocumentScalar] => entry[1] !== null && entry[1] !== undefined),
  );
}

function fromJsonScalar(value: Prisma.JsonValue): TlozDocumentScalar {
  if (
    value === null
    || typeof value === "string"
    || typeof value === "number"
    || typeof value === "boolean"
    || (Array.isArray(value) && value.every((item) => typeof item === "string"))
  ) {
    return value as TlozDocumentScalar;
  }
  return null;
}

function fromJsonOptions(value: Prisma.JsonValue | null): TlozFieldOption[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((option) => {
    if (
      typeof option !== "object"
      || option === null
      || Array.isArray(option)
      || typeof option.value !== "string"
      || typeof option.label !== "string"
    ) {
      return [];
    }
    return [{
      value: option.value,
      label: option.label,
      ...(typeof option.color === "string" ? { color: option.color } : {}),
      ...(typeof option.role === "string" ? { role: option.role as TlozFieldOption["role"] } : {}),
    }];
  });
}

function toJsonInput(value: TlozDocumentScalar | TlozFieldOption[] | undefined): Prisma.InputJsonValue | undefined {
  return value === undefined ? undefined : value as Prisma.InputJsonValue;
}

function toNullableJsonInput(
  value: TlozDocumentScalar | TlozFieldOption[] | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  return value === undefined || value === null
    ? Prisma.DbNull
    : value as Prisma.InputJsonValue;
}

function assertRevision(actual: number, expected: number) {
  if (actual !== expected) throw revisionConflict(expected, actual);
}

function revisionConflict(expected: number, actual?: number) {
  return new TlozDocumentError(
    "DOCUMENT_REVISION_CONFLICT",
    actual === undefined
      ? `La revisión ${expected} ya no es vigente.`
      : `La revisión ${expected} ya no es vigente; la revisión actual es ${actual}.`,
  );
}

function notFound(documentId: string) {
  return new TlozDocumentError("DOCUMENT_NOT_FOUND", `El documento ${documentId} no existe.`);
}
