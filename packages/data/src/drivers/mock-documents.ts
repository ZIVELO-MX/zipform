import type {
  TlozDocument,
  TlozDocumentScalar,
  TlozDocumentUpdate,
  TlozFieldDefinition,
  TlozMission,
  TlozProject,
  TlozQuestItem,
} from "@tloz/types";
import type {
  DocumentFilters,
  PaginatedResult,
  PaginationInput,
  TlozDocumentRepository,
} from "../contracts";
import {
  defaultInventoryFields,
  defaultMissionFields,
  validateDocumentProperties,
  validateProjectFields,
} from "../document-contract";
import { TlozDocumentError } from "../document-errors";

type MockDocumentData = {
  projects: TlozProject[];
  missions: TlozMission[];
  questItems: TlozQuestItem[];
};

type DocumentState = {
  id: string;
  revision: number;
  stamp: string;
  custom: Record<string, TlozDocumentScalar>;
  customProjects: Record<string, string>;
};

export function createMockDocumentRepository(data: MockDocumentData): TlozDocumentRepository {
  const inventoryProjectId = crypto.randomUUID();
  const unassignedProjectId = crypto.randomUUID();
  const state = new Map<string, DocumentState>();
  const contract = new Map<string, TlozFieldDefinition[]>();
  const inventoryPublicIds = new Map(
    [...data.questItems]
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id))
      .map((item, index) => [item.id, `INV-${String(index + 1).padStart(4, "0")}`]),
  );

  function stateFor(source: string, stamp: string): DocumentState {
    const current = state.get(source);
    if (!current) {
      const created = {
        id: crypto.randomUUID(),
        revision: 1,
        stamp,
        custom: {},
        customProjects: {},
      };
      state.set(source, created);
      return created;
    }
    if (current.stamp !== stamp) {
      current.revision += 1;
      current.stamp = stamp;
    }
    return current;
  }

  function allDocuments(): TlozDocument[] {
    const systemStamp = "2026-07-27T00:00:00.000Z";
    const inventoryProjectState = stateFor("system:project-inventory", systemStamp);
    const unassignedProjectState = stateFor("system:project-unassigned", systemStamp);
    const inventoryFields = contract.get(inventoryProjectId) ?? defaultInventoryFields(inventoryProjectId);
    const unassignedFields = contract.get(unassignedProjectId) ?? defaultMissionFields(unassignedProjectId);
    contract.set(inventoryProjectId, inventoryFields);
    contract.set(unassignedProjectId, unassignedFields);
    const inventoryProject = systemProjectDocument(
      inventoryProjectId,
      "project-inventory",
      "inventory",
      "Inventory",
      "Catálogo documental de recursos.",
      inventoryFields,
      inventoryProjectState,
    );
    const unassignedProject = systemProjectDocument(
      unassignedProjectId,
      "project-unassigned",
      "unassigned",
      "Sin proyecto",
      "Contenedor de compatibilidad para datos heredados.",
      unassignedFields,
      unassignedProjectState,
    );
    const projectDocuments = data.projects.map((project) => {
      const documentState = stateFor(`project:${project.id}`, project.updatedAt);
      const fields = contract.get(documentState.id) ?? defaultMissionFields(documentState.id);
      contract.set(documentState.id, fields);
      return {
        id: documentState.id,
        publicId: `project-${project.slug}`,
        kind: "project" as const,
        projectSlug: project.slug,
        title: project.name,
        summary: project.description,
        body: project.descriptionDetail,
        revision: documentState.revision,
        properties: compactProperties({
          status: project.status,
          category: project.type,
          owner: project.ownerId,
          color: project.color,
          icon: project.icon,
          start: project.startDate,
          due: project.dueDate ?? null,
        }),
        contract: { projectId: `project-${project.slug}`, fields },
        source: { type: "project" as const, id: project.id },
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    });
    const projectBySource = new Map(projectDocuments.map((document) => [document.source.id, document]));
    const missionDocuments = data.missions.map((mission) => {
      const documentState = stateFor(`mission:${mission.id}`, mission.updatedAt);
      const project = mission.projectId ? projectBySource.get(mission.projectId) : undefined;
      return {
        id: documentState.id,
        publicId: mission.displayId,
        kind: "mission" as const,
        parentId: project?.id ?? unassignedProject.id,
        parentPublicId: project?.publicId ?? unassignedProject.publicId,
        projectSlug: project?.projectSlug ?? unassignedProject.projectSlug,
        title: mission.title,
        summary: mission.description,
        body: mission.descriptionDetail,
        revision: documentState.revision,
        properties: {
          ...compactProperties({
            status: mission.status,
            category: mission.type,
            assignee: mission.ownerId,
            icon: mission.icon,
            start: mission.startDate ?? null,
            due: mission.dueDate ?? null,
            progress: mission.progress,
            blocked_reason: mission.blockedReason ?? null,
          }),
          ...visibleCustomProperties(documentState, project?.id ?? unassignedProject.id),
        },
        source: { type: "mission" as const, id: mission.id },
        createdAt: mission.createdAt,
        updatedAt: mission.updatedAt,
      };
    });
    const inventoryDocuments = data.questItems.map((item) => {
      const documentState = stateFor(`inventory:${item.id}`, item.updatedAt);
      return {
        id: documentState.id,
        publicId: inventoryPublicId(inventoryPublicIds, item.id),
        kind: "inventory" as const,
        parentId: inventoryProject.id,
        parentPublicId: inventoryProject.publicId,
        projectSlug: "inventory",
        title: item.name,
        summary: item.description,
        body: item.descriptionDetail,
        revision: documentState.revision,
        properties: {
          ...compactProperties({
            status: item.status,
            category: item.category,
            assignee: item.ownerId ?? null,
            icon: item.icon,
            acquired: item.acquiredAt ?? null,
          }),
          ...visibleCustomProperties(documentState, inventoryProject.id),
        },
        source: { type: "inventory" as const, id: item.id },
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });
    return [inventoryProject, unassignedProject, ...projectDocuments, ...missionDocuments, ...inventoryDocuments];
  }

  async function get(documentId: string) {
    return allDocuments().find((document) => (
      document.id === documentId
      || document.publicId === documentId
      || document.source?.id === documentId
    )) ?? null;
  }

  return {
    async find(filters: DocumentFilters = {}, pagination: PaginationInput = {}): Promise<PaginatedResult<TlozDocument>> {
      const limit = Math.min(Math.max(pagination.limit ?? 25, 1), 100);
      const query = filters.query?.trim().toLocaleLowerCase();
      const documents = allDocuments()
        .filter((document) => !filters.kind || document.kind === filters.kind)
        .filter((document) => !filters.projectId || document.parentId === filters.projectId || document.parentPublicId === filters.projectId)
        .filter((document) => !query || `${document.publicId} ${document.title} ${document.summary}`.toLocaleLowerCase().includes(query))
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.id.localeCompare(right.id));
      const cursorIndex = pagination.cursor
        ? documents.findIndex((document) => document.id === pagination.cursor)
        : -1;
      const page = documents.slice(cursorIndex >= 0 ? cursorIndex + 1 : 0, cursorIndex >= 0 ? cursorIndex + 1 + limit : limit);
      const lastIndex = cursorIndex >= 0 ? cursorIndex + page.length : page.length - 1;
      return {
        data: page,
        nextCursor: lastIndex < documents.length - 1 ? page.at(-1)?.id ?? null : null,
      };
    },
    get,
    async update(documentId: string, input: TlozDocumentUpdate, expectedRevision: number) {
      const document = await requiredDocument(get, documentId);
      assertRevision(document, expectedRevision);
      const parent = document.parentId ? await requiredDocument(get, document.parentId) : null;
      if (input.properties) {
        validateDocumentProperties(
          document.kind === "project" ? [] : parent?.contract?.fields ?? [],
          input.properties,
          document.kind,
        );
      }
      const now = new Date().toISOString();
      if (document.source?.type === "project") {
        const project = data.projects.find((candidate) => candidate.id === document.source!.id);
        if (!project) throw notFound(documentId);
        applyShared(project, input, now);
        applyProjectProperties(project, input.properties);
      } else if (document.source?.type === "mission") {
        const mission = data.missions.find((candidate) => candidate.id === document.source!.id);
        if (!mission) throw notFound(documentId);
        applyShared(mission, input, now);
        applyMissionProperties(mission, input.properties);
        if (typeof input.properties?.status === "string") {
          const option = parent?.contract?.fields
            .find((field) => field.key === "status")
            ?.options.find((candidate) => candidate.value === input.properties!.status);
          mission.completedAt = option?.role === "done" ? now : undefined;
        }
      } else if (document.source?.type === "inventory") {
        const item = data.questItems.find((candidate) => candidate.id === document.source!.id);
        if (!item) throw notFound(documentId);
        applyShared(item, input, now);
        applyInventoryProperties(item, input.properties);
      } else {
        const current = stateFor(`system:${document.publicId}`, document.updatedAt);
        current.stamp = now;
        current.revision += 1;
        current.custom = { ...current.custom, ...input.properties };
      }
      if (document.source) {
        const current = stateFor(`${document.source.type}:${document.source.id}`, now);
        current.stamp = now;
        current.revision = expectedRevision + 1;
        const custom = customProperties(input.properties);
        current.custom = { ...current.custom, ...custom };
        if (document.parentId) {
          current.customProjects = {
            ...current.customProjects,
            ...Object.fromEntries(Object.keys(custom).map((key) => [key, document.parentId!])),
          };
        }
      }
      return requiredDocument(get, document.id);
    },
    async replaceProjectContract(projectId: string, fields: TlozFieldDefinition[], expectedRevision: number) {
      const document = await requiredDocument(get, projectId);
      if (document.kind !== "project") {
        throw new TlozDocumentError("DOCUMENT_INVALID", "Solo un project puede definir un contrato.", {
          kind: "invalid",
        });
      }
      assertRevision(document, expectedRevision);
      contract.set(document.id, validateProjectFields(fields));
      const stateKey = document.source ? `project:${document.source.id}` : `system:${document.publicId}`;
      const current = stateFor(stateKey, document.updatedAt);
      current.revision = expectedRevision + 1;
      current.stamp = new Date().toISOString();
      return requiredDocument(get, document.id);
    },
    async delete(documentId: string, expectedRevision: number) {
      const document = await requiredDocument(get, documentId);
      assertRevision(document, expectedRevision);
      if (!document.source) {
        throw new TlozDocumentError("DOCUMENT_INVALID", "Los Projects de sistema no se pueden eliminar.");
      }
      if (document.source.type === "project") {
        if (data.missions.some((mission) => mission.projectId === document.source!.id)) {
          throw new TlozDocumentError("DOCUMENT_INVALID", "El Project conserva Missions y no se puede eliminar.");
        }
        data.projects.splice(data.projects.findIndex((project) => project.id === document.source!.id), 1);
      } else if (document.source.type === "mission") {
        data.missions.splice(data.missions.findIndex((mission) => mission.id === document.source!.id), 1);
      } else {
        data.questItems.splice(data.questItems.findIndex((item) => item.id === document.source!.id), 1);
      }
      state.delete(`${document.source.type}:${document.source.id}`);
    },
  };
}

function systemProjectDocument(
  id: string,
  publicId: string,
  slug: string,
  title: string,
  summary: string,
  fields: TlozFieldDefinition[],
  state: DocumentState,
): TlozDocument {
  return {
    id,
    publicId,
    kind: "project",
    projectSlug: slug,
    title,
    summary,
    body: "",
    revision: state.revision,
    properties: {
      status: slug === "unassigned" ? "archived" : "active",
      category: "system",
      icon: slug === "inventory" ? "PackageOpen" : "FolderKanban",
      ...state.custom,
    },
    contract: { projectId: publicId, fields },
    createdAt: "2026-07-27T00:00:00.000Z",
    updatedAt: state.stamp,
  };
}

function applyShared(
  entity: { name?: string; title?: string; description: string; descriptionDetail: string; updatedAt: string },
  input: TlozDocumentUpdate,
  now: string,
) {
  if (input.title !== undefined) {
    if (!input.title.trim()) {
      throw new TlozDocumentError("DOCUMENT_INVALID", "El título no puede estar vacío.", { title: "required" });
    }
    if ("title" in entity) entity.title = input.title.trim();
    else entity.name = input.title.trim();
  }
  if (input.summary !== undefined) entity.description = input.summary.trim();
  if (input.body !== undefined) entity.descriptionDetail = input.body.trim();
  entity.updatedAt = now;
}

function applyProjectProperties(project: TlozProject, properties?: Record<string, TlozDocumentScalar>) {
  if (!properties) return;
  if (typeof properties.status === "string") project.status = properties.status as TlozProject["status"];
  if (typeof properties.category === "string") project.type = properties.category as TlozProject["type"];
  if (typeof properties.owner === "string") project.ownerId = properties.owner;
  if (typeof properties.color === "string") project.color = properties.color;
  if (typeof properties.icon === "string") project.icon = properties.icon;
  if (typeof properties.start === "string") project.startDate = properties.start;
  if (typeof properties.due === "string" || properties.due === null) project.dueDate = properties.due ?? undefined;
}

function applyMissionProperties(mission: TlozMission, properties?: Record<string, TlozDocumentScalar>) {
  if (!properties) return;
  if (typeof properties.status === "string") mission.status = properties.status as TlozMission["status"];
  if (typeof properties.category === "string") mission.type = properties.category as TlozMission["type"];
  if (typeof properties.assignee === "string") mission.ownerId = properties.assignee;
  if (typeof properties.icon === "string") mission.icon = properties.icon;
  if (typeof properties.start === "string" || properties.start === null) mission.startDate = properties.start ?? undefined;
  if (typeof properties.due === "string" || properties.due === null) mission.dueDate = properties.due ?? undefined;
  if (typeof properties.progress === "number") mission.progress = properties.progress;
  if (typeof properties.blocked_reason === "string" || properties.blocked_reason === null) {
    mission.blockedReason = properties.blocked_reason ?? undefined;
  }
}

function applyInventoryProperties(item: TlozQuestItem, properties?: Record<string, TlozDocumentScalar>) {
  if (!properties) return;
  if (typeof properties.status === "string") item.status = properties.status as TlozQuestItem["status"];
  if (typeof properties.category === "string") item.category = properties.category as TlozQuestItem["category"];
  if (typeof properties.assignee === "string" || properties.assignee === null) item.ownerId = properties.assignee ?? undefined;
  if (typeof properties.icon === "string") item.icon = properties.icon;
  if (typeof properties.acquired === "string" || properties.acquired === null) item.acquiredAt = properties.acquired ?? undefined;
}

function customProperties(properties?: Record<string, TlozDocumentScalar>) {
  if (!properties) return {};
  const system = new Set(["status", "category", "owner", "assignee", "color", "icon", "start", "due", "progress", "blocked_reason", "acquired"]);
  return Object.fromEntries(Object.entries(properties).filter(([key]) => !system.has(key)));
}

function visibleCustomProperties(state: DocumentState, projectId: string) {
  return Object.fromEntries(
    Object.entries(state.custom).filter(([key]) => (
      !state.customProjects[key] || state.customProjects[key] === projectId
    )),
  );
}

function compactProperties(properties: Record<string, TlozDocumentScalar>) {
  return Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== null));
}

function inventoryPublicId(values: Map<string, string>, itemId: string) {
  const existing = values.get(itemId);
  if (existing) return existing;
  const next = `INV-${String(values.size + 1).padStart(4, "0")}`;
  values.set(itemId, next);
  return next;
}

async function requiredDocument(
  get: (documentId: string) => Promise<TlozDocument | null>,
  documentId: string,
) {
  const document = await get(documentId);
  if (!document) throw notFound(documentId);
  return document;
}

function assertRevision(document: TlozDocument, expectedRevision: number) {
  if (document.revision !== expectedRevision) {
    throw new TlozDocumentError(
      "DOCUMENT_REVISION_CONFLICT",
      `La revisión ${expectedRevision} ya no es vigente; la revisión actual es ${document.revision}.`,
    );
  }
}

function notFound(documentId: string) {
  return new TlozDocumentError("DOCUMENT_NOT_FOUND", `El documento ${documentId} no existe.`);
}
