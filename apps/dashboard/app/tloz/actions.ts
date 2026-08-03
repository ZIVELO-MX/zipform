"use server";

import {
  dataClient,
  validateDocumentProperties,
  type TlozMissionCreateInput,
  type TlozMissionUpdateInput,
  type TlozProjectCreateInput,
  type TlozProjectUpdateInput,
  type TlozQuestItemCreateInput,
  type TlozQuestItemUpdateInput,
  type TlozResourceInput,
} from "@tloz/data";
import type {
  TlozDocument,
  TlozDocumentScalar,
  TlozDocumentUpdate,
  TlozFieldDefinition,
  TlozMissionStatus,
} from "@tloz/types";
import { revalidatePath } from "next/cache";
import { auth } from "../../auth";
import {
  assertTlozOperation,
  authorizeTlozOperation,
  isFullStackDeveloper,
  isReadOnlyAgent,
  TlozAuthorizationError,
  type TlozOperation,
  toPublicMissionOwner,
  toPublicUserProfile,
} from "../../lib/authorization";
import { getTlozMissionDetailWithAttachments } from "../../lib/tloz-data";

const revalidateTloz = () => revalidatePath("/", "layout");

async function authenticatedActor() {
  const session = await auth();
  if (!session?.user?.id) throw new TlozAuthorizationError("UNAUTHORIZED", 401);
  assertTlozOperation(session.user, "read");
  return session.user;
}

async function authorizeMission(missionId: string, operation: TlozOperation = "update") {
  const actor = await authenticatedActor();
  const mission = await dataClient.tloz.getMissionDetail(missionId);
  if (!mission) throw new Error("Misión no encontrada.");
  assertTlozOperation(actor, operation, { ownerId: mission.ownerId });
  return { actor, mission };
}

async function authorizeProject(projectId: string, operation: TlozOperation = "update") {
  const actor = await authenticatedActor();
  const project = (await dataClient.tloz.getProjects()).find((candidate) => candidate.id === projectId);
  if (!project) throw new Error("Proyecto no encontrado.");
  assertTlozOperation(actor, operation, { ownerId: project.ownerId });
  return { actor, project };
}

async function authorizeQuestItem(itemId: string, operation: TlozOperation = "update") {
  const actor = await authenticatedActor();
  const item = (await dataClient.tloz.getQuestItems()).find((candidate) => candidate.id === itemId);
  if (!item) throw new Error("Quest item no encontrado.");
  assertTlozOperation(actor, operation, { ownerId: item.ownerId });
  return { actor, item };
}

function documentOwnerId(document: TlozDocument) {
  const key = document.kind === "project" ? "owner" : "assignee";
  const owner = document.properties[key];
  return typeof owner === "string" ? owner : null;
}

function changesDocumentOwner(document: TlozDocument, input: TlozDocumentUpdate) {
  const key = document.kind === "project" ? "owner" : "assignee";
  return Object.prototype.hasOwnProperty.call(input.properties ?? {}, key);
}

function documentCapabilities(
  actor: Awaited<ReturnType<typeof authenticatedActor>>,
  document: TlozDocument,
) {
  const context = { ownerId: documentOwnerId(document) };
  return {
    canUpdate: authorizeTlozOperation(actor, "update", context).allowed,
    canMove: authorizeTlozOperation(actor, "move", context).allowed,
  };
}

async function mutateDocument(
  documentId: string,
  input: TlozDocumentUpdate,
  expectedRevision?: number,
) {
  const actor = await authenticatedActor();
  const document = await dataClient.canonicalDocuments.get(documentId);
  if (!document) throw new Error("Documento no encontrado.");
  const operation = document.source
    ? changesDocumentOwner(document, input) ? "move" : "update"
    : "structure";
  assertTlozOperation(actor, operation, { ownerId: documentOwnerId(document) });
  return dataClient.canonicalDocuments.update(
    document.id,
    input,
    expectedRevision ?? document.revision,
  );
}

export async function updateDocument(
  documentId: string,
  input: TlozDocumentUpdate,
  revision: number,
) {
  const updated = await mutateDocument(documentId, input, revision);
  revalidateTloz();
  return updated;
}

export async function createMission(
  input: TlozMissionCreateInput,
  documentProperties: Record<string, TlozDocumentScalar> = {},
) {
  const actor = await authenticatedActor();
  assertTlozOperation(actor, "create", { requestedOwnerId: input.ownerId });
  const projectDocument = await dataClient.canonicalDocuments.get(input.projectId);
  const statusField = projectDocument?.contract?.fields.find((field) => field.key === "status");
  const categoryField = projectDocument?.contract?.fields.find((field) => field.key === "category");
  const status = input.status ?? contractFieldDefault(statusField, "next");
  if (statusField && !statusField.options.some((option) => option.value === status)) {
    throw new Error("El estado no pertenece al contrato del Project.");
  }
  if (categoryField && !categoryField.options.some((option) => option.value === input.type)) {
    throw new Error("La categoría no pertenece al contrato del Project.");
  }
  if (projectDocument?.contract) {
    validateDocumentProperties(projectDocument.contract.fields, {
      ...documentProperties,
      status,
      category: input.type,
    }, "mission");
  } else if (Object.keys(documentProperties).length) {
    throw new Error("El Project no tiene un contrato documental disponible.");
  }
  const mission = await dataClient.tloz.createMission({ ...input, status });
  if (Object.keys(documentProperties).length) {
    const document = await dataClient.canonicalDocuments.get(mission.id);
    if (!document) throw new Error("No se pudo resolver el documento de la Mission creada.");
    await dataClient.canonicalDocuments.update(
      document.id,
      { properties: documentProperties },
      document.revision,
    );
  }
  revalidateTloz();
  return mission;
}

export async function updateMission(missionId: string, input: TlozMissionUpdateInput) {
  const document = await dataClient.canonicalDocuments.get(missionId);
  const legacyOnlyFields = ["displayId", "projectId", "seasonId", "episodeId", "completedAt"];
  const requiresLegacyMutation = legacyOnlyFields.some((field) => (
    Object.prototype.hasOwnProperty.call(input, field)
  ));
  if (document?.kind === "mission" && !requiresLegacyMutation) {
    await mutateDocument(document.id, missionDocumentUpdate(input), document.revision);
    const mission = (await dataClient.tloz.getMissions())
      .find((candidate) => candidate.id === missionId);
    if (!mission) throw new Error("Misión no encontrada.");
    revalidateTloz();
    return mission;
  }

  const changesPlacement = ["ownerId", "projectId", "seasonId", "episodeId"]
    .some((field) => Object.prototype.hasOwnProperty.call(input, field));
  const { mission: current } = await authorizeMission(
    missionId,
    changesPlacement ? "move" : "update",
  );
  const next = { ...input };
  if (input.projectId !== undefined || input.status !== undefined || input.type !== undefined) {
    const projectId = input.projectId ?? current.projectId;
    const project = projectId ? await dataClient.canonicalDocuments.get(projectId) : null;
    if (project?.contract) {
      const statusField = project.contract.fields.find((field) => field.key === "status");
      const categoryField = project.contract.fields.find((field) => field.key === "category");
      const requestedStatus = input.status ?? current.status;
      const requestedCategory = input.type ?? current.type;
      const statusOption = statusField?.options.find((option) => option.value === requestedStatus);
      const categoryOption = categoryField?.options.find((option) => option.value === requestedCategory);

      if (statusField && !statusOption) {
        if (input.projectId === undefined) throw new Error("El estado no pertenece al contrato del Project.");
        next.status = contractFieldDefault(statusField, "later") as TlozMissionStatus;
      }
      if (categoryField && !categoryOption) {
        if (input.projectId === undefined) throw new Error("La categoría no pertenece al contrato del Project.");
        next.type = contractFieldDefault(categoryField, "side_quest");
      }

      const effectiveStatus = statusOption
        ?? statusField?.options.find((option) => option.value === next.status);
      if (input.status !== undefined || input.projectId !== undefined) {
        next.completedAt = effectiveStatus?.role === "done"
          ? new Date().toISOString()
          : undefined;
      }
    }
  }
  const mission = await dataClient.tloz.updateMission(missionId, next);
  revalidateTloz();
  return mission;
}

export async function getMissionDetail(missionId: string) {
  const actor = await authenticatedActor();
  const mission = await getTlozMissionDetailWithAttachments(missionId);
  return mission && isReadOnlyAgent(actor) ? toPublicMissionOwner(mission) : mission;
}

export async function getMissionCapabilities(missionId: string) {
  const actor = await authenticatedActor();
  const mission = await dataClient.tloz.getMissionDetail(missionId);
  if (!mission) throw new Error("Misión no encontrada.");
  return {
    canUpdate: authorizeTlozOperation(actor, "update", { ownerId: mission.ownerId }).allowed,
    canMove: authorizeTlozOperation(actor, "move", { ownerId: mission.ownerId }).allowed,
  };
}

export async function getMissionDetailOptions() {
  const actor = await authenticatedActor();
  const [missions, projects, questItems, users] = await Promise.all([
    dataClient.tloz.getMissions(),
    dataClient.tloz.getProjects(),
    dataClient.tloz.getQuestItems(),
    dataClient.tloz.getUsers(),
  ]);
  return isReadOnlyAgent(actor)
    ? { missions: missions.map(toPublicMissionOwner), projects, questItems, users: users.map(toPublicUserProfile) }
    : { missions, projects, questItems, users };
}

export async function getMissionDocumentOptions(missionId: string) {
  await authorizeMission(missionId, "read");
  const document = await dataClient.canonicalDocuments.get(missionId);
  if (!document || document.kind !== "mission") return { document: null, contract: [] };
  const project = document.parentId ? await dataClient.canonicalDocuments.get(document.parentId) : null;
  return {
    document,
    contract: project?.contract?.fields ?? [],
  };
}

export async function getDocumentDetailOptions(documentId: string) {
  const actor = await authenticatedActor();
  const document = await dataClient.canonicalDocuments.get(documentId, {
    includeChildren: true,
    childrenPagination: { limit: 1 },
  });
  if (!document) throw new Error("Documento no encontrado.");
  assertTlozOperation(actor, "read", { ownerId: documentOwnerId(document) });

  const definitionKey = document.kind === "project"
    ? "projects"
    : document.kind === "inventory"
      ? "inventory"
      : `project:${document.parentId}:children`;
  const definition = await dataClient.canonicalDocuments.getDefinition(definitionKey);
  if (!definition) throw new Error("Definición documental no encontrada.");
  const parent = document.parentId
    ? await dataClient.canonicalDocuments.get(document.parentId)
    : null;
  return {
    document,
    definition,
    contract: document.kind === "project" ? [] : parent?.contract?.fields ?? [],
    capabilities: documentCapabilities(actor, document),
  };
}

export async function updateDocumentProperties(
  documentId: string,
  properties: Record<string, string | number | boolean | string[] | null>,
  revision?: number,
) {
  const updated = await mutateDocument(documentId, { properties }, revision);
  revalidateTloz();
  return updated;
}

export async function updateDocumentContent(
  documentId: string,
  input: Pick<TlozDocumentUpdate, "title" | "summary">,
  revision: number,
) {
  const updated = await mutateDocument(documentId, input, revision);
  revalidateTloz();
  return updated;
}

export async function updateDocumentBody(
  documentId: string,
  body: string,
  revision: number,
) {
  const updated = await mutateDocument(documentId, { body }, revision);
  revalidateTloz();
  return updated;
}

export async function getEntityResources(kind: "project" | "inventory", entityId: string) {
  await authenticatedActor();
  const resources = await dataClient.tloz.getResources();
  return resources.filter((resource) => kind === "project" ? resource.projectId === entityId : resource.questItemId === entityId);
}

export async function getTlozDetailUsers() {
  const actor = await authenticatedActor();
  const users = await dataClient.tloz.getUsers();
  return isReadOnlyAgent(actor) ? users.map(toPublicUserProfile) : users;
}

export async function createProject(input: TlozProjectCreateInput | string) {
  const actor = await authenticatedActor();
  const value = typeof input === "string"
    ? { name: input, description: "", icon: "FolderKanban", color: "#6B6B6B", status: "active" as const, type: "normal" as const, ownerId: actor.id, startDate: new Date().toISOString().slice(0, 10) }
    : input;
  assertTlozOperation(actor, "create", { requestedOwnerId: value.ownerId });
  const project = await dataClient.tloz.createProject(value);
  revalidateTloz();
  return project;
}

export async function createQuestItem(input: TlozQuestItemCreateInput) {
  const actor = await authenticatedActor();
  const value = isFullStackDeveloper(actor) && !input.ownerId ? { ...input, ownerId: actor.id } : input;
  assertTlozOperation(actor, "create", { requestedOwnerId: value.ownerId ?? null });
  const item = await dataClient.tloz.createQuestItem(value);
  revalidateTloz();
  return item;
}

export async function updateProject(projectId: string, input: TlozProjectUpdateInput) {
  const document = await dataClient.canonicalDocuments.get(projectId);
  if (!document || document.kind !== "project") {
    await authorizeProject(projectId, Object.prototype.hasOwnProperty.call(input, "ownerId") ? "move" : "update");
    const value = await dataClient.tloz.updateProject(projectId, input);
    revalidateTloz();
    return value;
  }
  await mutateDocument(document.id, projectDocumentUpdate(input), document.revision);
  const value = (await dataClient.tloz.getProjects()).find((project) => project.id === projectId);
  if (!value) throw new Error("Proyecto no encontrado.");
  revalidateTloz();
  return value;
}

export async function updateQuestItem(itemId: string, input: TlozQuestItemUpdateInput) {
  const document = await dataClient.canonicalDocuments.get(itemId);
  if (!document || document.kind !== "inventory") {
    await authorizeQuestItem(itemId, Object.prototype.hasOwnProperty.call(input, "ownerId") ? "move" : "update");
    const value = await dataClient.tloz.updateQuestItem(itemId, input);
    revalidateTloz();
    return value;
  }
  await mutateDocument(document.id, inventoryDocumentUpdate(input), document.revision);
  const value = (await dataClient.tloz.getQuestItems()).find((item) => item.id === itemId);
  if (!value) throw new Error("Quest item no encontrado.");
  revalidateTloz();
  return value;
}

export async function replaceProjectContract(
  documentId: string,
  fields: TlozFieldDefinition[],
  revision: number,
) {
  const actor = await authenticatedActor();
  const document = await dataClient.canonicalDocuments.get(documentId);
  if (!document || document.kind !== "project") throw new Error("Project document not found.");
  assertTlozOperation(actor, "structure", {
    ownerId: typeof document.properties.owner === "string" ? document.properties.owner : null,
  });
  const value = await dataClient.canonicalDocuments.replaceProjectContract(document.id, fields, revision);
  revalidateTloz();
  return value;
}

export async function saveMissionDocument(missionId: string, markdown: string) {
  const document = await dataClient.canonicalDocuments.get(missionId);
  if (!document || document.kind !== "mission") {
    await authorizeMission(missionId);
    const mission = await dataClient.tloz.saveMissionDocument(missionId, markdown);
    revalidateTloz();
    return mission;
  }
  await mutateDocument(document.id, { body: markdown }, document.revision);
  const mission = await dataClient.tloz.getMissionDetail(missionId);
  if (!mission) throw new Error("Misión no encontrada.");
  revalidateTloz();
  return mission;
}

export async function addMissionDependency(missionId: string, dependsOnMissionId: string) {
  await authorizeMission(missionId);
  const mission = await dataClient.tloz.addMissionDependency(missionId, dependsOnMissionId);
  revalidateTloz();
  return mission;
}

export async function removeMissionDependency(missionId: string, dependsOnMissionId: string) {
  await authorizeMission(missionId);
  const mission = await dataClient.tloz.removeMissionDependency(missionId, dependsOnMissionId);
  revalidateTloz();
  return mission;
}

export async function setMissionQuestItem(missionId: string, questItemId: string, required: boolean) {
  await authorizeMission(missionId);
  const mission = await dataClient.tloz.setMissionQuestItem(missionId, questItemId, required);
  revalidateTloz();
  return mission;
}

export async function removeMissionQuestItem(missionId: string, questItemId: string) {
  await authorizeMission(missionId);
  const mission = await dataClient.tloz.removeMissionQuestItem(missionId, questItemId);
  revalidateTloz();
  return mission;
}

export async function addMissionResource(missionId: string, input: TlozResourceInput) {
  await authorizeMission(missionId);
  const mission = await dataClient.tloz.addMissionResource(missionId, input);
  revalidateTloz();
  return mission;
}

export async function removeMissionResource(missionId: string, resourceId: string) {
  const { mission } = await authorizeMission(missionId);
  if (!mission.resources.some((resource) => resource.id === resourceId)) throw new Error("Recurso no encontrado.");
  const value = await dataClient.tloz.removeMissionResource(missionId, resourceId);
  revalidateTloz();
  return value;
}

export async function addProjectResource(projectId: string, input: TlozResourceInput) {
  await authorizeProject(projectId);
  const value = await dataClient.tloz.addProjectResource(projectId, input);
  revalidateTloz();
  return value;
}

export async function removeProjectResource(projectId: string, resourceId: string) {
  await authorizeProject(projectId);
  const belongsToProject = (await dataClient.tloz.getResources())
    .some((resource) => resource.id === resourceId && resource.projectId === projectId);
  if (!belongsToProject) throw new Error("Recurso no encontrado.");
  const value = await dataClient.tloz.removeProjectResource(projectId, resourceId);
  revalidateTloz();
  return value;
}

export async function addQuestItemResource(itemId: string, input: TlozResourceInput) {
  await authorizeQuestItem(itemId);
  const value = await dataClient.tloz.addQuestItemResource(itemId, input);
  revalidateTloz();
  return value;
}

export async function removeQuestItemResource(itemId: string, resourceId: string) {
  await authorizeQuestItem(itemId);
  const belongsToItem = (await dataClient.tloz.getResources())
    .some((resource) => resource.id === resourceId && resource.questItemId === itemId);
  if (!belongsToItem) throw new Error("Recurso no encontrado.");
  const value = await dataClient.tloz.removeQuestItemResource(itemId, resourceId);
  revalidateTloz();
  return value;
}

export async function patchMissionStatus(missionId: string, status: TlozMissionStatus) {
  return updateMission(missionId, { status });
}

function contractFieldDefault(
  field: TlozFieldDefinition | undefined,
  fallback: string,
) {
  return typeof field?.defaultValue === "string"
    ? field.defaultValue
    : field?.options[0]?.value ?? fallback;
}

function missionDocumentUpdate(input: TlozMissionUpdateInput): TlozDocumentUpdate {
  const properties: Record<string, TlozDocumentScalar> = {};
  if (input.status !== undefined) properties.status = input.status;
  if (input.type !== undefined) properties.category = input.type;
  if (input.ownerId !== undefined) properties.assignee = input.ownerId;
  if (input.icon !== undefined) properties.icon = input.icon;
  if (input.startDate !== undefined) properties.start = input.startDate || null;
  if (input.dueDate !== undefined) properties.due = input.dueDate || null;
  if (input.progress !== undefined) properties.progress = input.progress;
  if (input.blockedReason !== undefined) properties.blocked_reason = input.blockedReason || null;
  return {
    ...(input.title === undefined ? {} : { title: input.title }),
    ...(input.description === undefined ? {} : { summary: input.description }),
    ...(input.descriptionDetail === undefined ? {} : { body: input.descriptionDetail }),
    ...(Object.keys(properties).length ? { properties } : {}),
  };
}

function projectDocumentUpdate(input: TlozProjectUpdateInput): TlozDocumentUpdate {
  const properties: Record<string, TlozDocumentScalar> = {};
  if (input.status !== undefined) properties.status = input.status;
  if (input.type !== undefined) properties.category = input.type;
  if (input.ownerId !== undefined) properties.owner = input.ownerId;
  if (input.icon !== undefined) properties.icon = input.icon;
  if (input.color !== undefined) properties.color = input.color;
  if (input.startDate !== undefined) properties.start = input.startDate;
  if (input.dueDate !== undefined) properties.due = input.dueDate || null;
  return {
    ...(input.name === undefined ? {} : { title: input.name }),
    ...(input.description === undefined ? {} : { summary: input.description }),
    ...(input.descriptionDetail === undefined ? {} : { body: input.descriptionDetail }),
    ...(Object.keys(properties).length ? { properties } : {}),
  };
}

function inventoryDocumentUpdate(input: TlozQuestItemUpdateInput): TlozDocumentUpdate {
  const properties: Record<string, TlozDocumentScalar> = {};
  if (input.status !== undefined) properties.status = input.status;
  if (input.category !== undefined) properties.category = input.category;
  if (input.ownerId !== undefined) properties.assignee = input.ownerId || null;
  if (input.icon !== undefined) properties.icon = input.icon;
  if (input.color !== undefined) properties.color = input.color;
  if (input.acquiredAt !== undefined) properties.acquired = input.acquiredAt || null;
  return {
    ...(input.name === undefined ? {} : { title: input.name }),
    ...(input.description === undefined ? {} : { summary: input.description }),
    ...(input.descriptionDetail === undefined ? {} : { body: input.descriptionDetail }),
    ...(Object.keys(properties).length ? { properties } : {}),
  };
}

export async function deleteMission(missionId: string) {
  const actor = await authenticatedActor();
  assertTlozOperation(actor, "delete-mission");
  const mission = await dataClient.tloz.getMissionDetail(missionId);
  if (!mission) throw new Error("Misión no encontrada.");
  await dataClient.tloz.deleteMission(missionId);
  revalidateTloz();
}
