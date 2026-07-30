import type {
  ContainerContentData,
  ContainerContentStore,
  ContainerDefinition,
  ContainerRecord,
  ContentRecord,
  ContentUpdate,
  ContentFilters,
} from "./container-content-store";
import type {
  TlozDocument,
  TlozDocumentDefinition,
  TlozDocumentKind,
  TlozDocumentScalar,
  TlozDocumentUpdate,
  TlozFieldDefinition,
} from "@tloz/types";
import type { TlozDocumentRepository } from "./contracts";
import { TlozDocumentError } from "./document-errors";

const PRESENTATIONS: Record<TlozDocumentKind, string> = {
  project: "project",
  mission: "mission",
  inventory: "quest-item",
};

function scalar(value: ContainerContentData): TlozDocumentScalar | undefined {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) return value as string[];
  return undefined;
}

function properties(data: Record<string, ContainerContentData>) {
  return Object.fromEntries(Object.entries(data).flatMap(([key, value]) => {
    const item = scalar(value);
    return item === undefined ? [] : [[key, item]];
  }));
}

function fieldDefinitions(definition: ContainerDefinition): TlozFieldDefinition[] {
  return definition.fields.map((field, index) => ({
    id: field.key,
    key: field.key,
    label: field.label,
    type: field.format as TlozFieldDefinition["type"],
    required: field.required ?? false,
    visible: field.visible ?? true,
    position: index,
    defaultValue: scalar(field.defaultValue ?? null),
    options: field.options ?? [],
  }));
}

function documentDefinition(id: string, key: string, kind: TlozDocumentKind, definition: ContainerDefinition): TlozDocumentDefinition {
  return {
    id,
    key,
    kind,
    scope: key.includes(":children") ? "children" : "collection",
    fields: definition.fields.map((field, position) => ({
      key: field.key,
      label: field.label,
      format: field.format as "text" | "status" | "date" | "person" | "number" | "id",
      position,
      visible: field.visible ?? true,
      options: field.options,
    })),
    views: definition.views.map((view) => ({ ...view, id: view.id as TlozDocumentDefinition["views"][number]["id"] })),
    defaultView: definition.defaultView as TlozDocumentDefinition["defaultView"],
  };
}

function parentData(container: ContainerRecord) {
  return {
    parentId: undefined,
    parentPublicId: undefined,
    projectSlug: container.slug,
    contract: { projectId: container.id, fields: fieldDefinitions(container.definition) },
  };
}

function contentDocument(content: ContentRecord, container?: ContainerRecord): TlozDocument {
  const kind: TlozDocumentKind = content.presentation === "mission" ? "mission" : "inventory";
  return {
    id: content.id,
    publicId: content.publicId,
    kind,
    parentId: container?.id,
    parentPublicId: container?.publicId,
    projectSlug: container?.slug,
    title: content.title,
    summary: content.summary,
    body: content.body,
    revision: content.revision,
    properties: properties(content.data),
    createdAt: content.createdAt,
    updatedAt: content.updatedAt,
    source: { type: kind, id: content.id },
  };
}

function containerDocument(container: ContainerRecord): TlozDocument {
  return {
    id: container.id,
    publicId: container.publicId,
    kind: "project",
    ...parentData(container),
    title: container.title,
    summary: container.summary,
    body: container.body,
    revision: container.revision,
    properties: properties(container.data),
    contract: { projectId: container.id, fields: fieldDefinitions(container.definition) },
    createdAt: container.createdAt,
    updatedAt: container.updatedAt,
    source: { type: "project", id: container.id },
  };
}

export function createContainerContentDocumentRepository(store: ContainerContentStore): TlozDocumentRepository {
  async function resolve(reference: string) {
    const container = await store.getContainer(reference) ?? (await store.listContainers()).find((item) => item.publicId === reference);
    if (container) return { type: "container" as const, container };
    const content = await store.getContent(reference) ?? (await store.listContents()).find((item) => item.publicId === reference);
    return content ? { type: "content" as const, content, container: await store.getContainer(content.containerId) } : null;
  }

  return {
    async find(filters = {}, pagination = {}) {
      const containers = filters.kind === "project" || !filters.kind ? await store.listContainers({ presentation: filters.kind === "project" ? "project" : undefined }) : [];
      const contents = filters.kind === "project" ? [] : await store.listContents({
        containerId: filters.parentId,
        presentation: filters.kind ? PRESENTATIONS[filters.kind] : undefined,
      });
      const contentDocuments = await Promise.all(contents.map(async (content) => contentDocument(content, await store.getContainer(content.containerId) ?? undefined)));
      let data = [...containers.map(containerDocument), ...contentDocuments];
      if (filters.query) {
        const query = filters.query.toLowerCase();
        data = data.filter((item) => `${item.title} ${item.summary} ${item.publicId}`.toLowerCase().includes(query));
      }
      data.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.id.localeCompare(right.id));
      const limit = Math.min(Math.max(pagination.limit ?? 25, 1), 100);
      const start = pagination.cursor ? Math.max(data.findIndex((item) => item.id === pagination.cursor) + 1, 0) : 0;
      const page = data.slice(start, start + limit);
      return { data: page, nextCursor: start + page.length < data.length ? page.at(-1)?.id ?? null : null };
    },

    async get(documentId, options = {}) {
      const resolved = await resolve(documentId);
      if (!resolved) return null;
      if (resolved.type === "content") return contentDocument(resolved.content, resolved.container ?? undefined);
      const document = containerDocument(resolved.container);
      if (options.includeChildren) {
        const children = await this.find({ kind: "mission", parentId: resolved.container.id }, options.childrenPagination);
        document.children = { data: children.data, nextCursor: children.nextCursor, total: children.data.length };
      }
      return document;
    },

    async getDefinition(definitionKey) {
      const reference = definitionKey.includes(":children") ? definitionKey.split(":")[1] : definitionKey;
      const resolved = definitionKey === "projects" ? null : await resolve(reference);
      const projectContainer = definitionKey === "projects"
        ? (await store.listContainers({ presentation: "project" })).at(0)
        : undefined;
      const container = projectContainer ?? resolved?.container;
      if (!container) return null;
      const kind = definitionKey === "inventory" ? "inventory" : definitionKey.includes(":children") ? "mission" : "project";
      return documentDefinition(container.id, definitionKey, kind, container.definition);
    },

    async update(documentId, input, expectedRevision) {
      const resolved = await resolve(documentId);
      if (!resolved) throw new TlozDocumentError("DOCUMENT_NOT_FOUND", "Documento no encontrado.");
      const update = documentUpdate(input);
      if (resolved.type === "container") return containerDocument(await store.updateContainer(resolved.container.id, update, expectedRevision));
      const content = await store.updateContent(resolved.content.id, update, expectedRevision);
      return contentDocument(content, resolved.container ?? undefined);
    },

    async replaceProjectContract(projectId, fields, expectedRevision) {
      const resolved = await resolve(projectId);
      if (!resolved || resolved.type !== "container") throw new TlozDocumentError("DOCUMENT_NOT_FOUND", "Project no encontrado.");
      const definition = resolved.container.definition;
      const updated = await store.updateContainer(resolved.container.id, {
        definition: {
          ...definition,
          fields: fields.map((field) => ({
            key: field.key,
            label: field.label,
            format: field.type,
            required: field.required,
            visible: field.visible,
            defaultValue: field.defaultValue,
            options: field.options,
          })),
        },
      }, expectedRevision);
      return containerDocument(updated);
    },

    async delete(documentId, expectedRevision) {
      const resolved = await resolve(documentId);
      if (!resolved) throw new TlozDocumentError("DOCUMENT_NOT_FOUND", "Documento no encontrado.");
      if (resolved.type === "container") await store.deleteContainer(resolved.container.id, expectedRevision);
      else await store.deleteContent(resolved.content.id, expectedRevision);
    },
  };
}

function documentUpdate(input: TlozDocumentUpdate): ContentUpdate {
  return {
    title: input.title,
    summary: input.summary,
    body: input.body,
    data: input.properties as Record<string, ContainerContentData> | undefined,
  };
}
