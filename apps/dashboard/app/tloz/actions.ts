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
import type { TlozDocumentScalar, TlozFieldDefinition, TlozMissionStatus } from "@tloz/types";
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

export async function createMission(
  input: TlozMissionCreateInput,
  documentProperties: Record<string, TlozDocumentScalar> = {},
) {
  const actor = await authenticatedActor();
  assertTlozOperation(actor, "create", { requestedOwnerId: input.ownerId });
  const projectDocument = await dataClient.documents.get(input.projectId);
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
    const document = await dataClient.documents.get(mission.id);
    if (!document) throw new Error("No se pudo resolver el documento de la Mission creada.");
    await dataClient.documents.update(
      document.id,
      { properties: documentProperties },
      document.revision,
    );
  }
  revalidateTloz();
  return mission;
}

export async function updateMission(missionId: string, input: TlozMissionUpdateInput) {
  const changesPlacement = ["ownerId", "projectId", "seasonId", "episodeId"]
    .some((field) => Object.prototype.hasOwnProperty.call(input, field));
  const { mission: current } = await authorizeMission(
    missionId,
    changesPlacement ? "move" : "update",
  );
  const next = { ...input };
  if (input.projectId !== undefined || input.status !== undefined || input.type !== undefined) {
    const projectId = input.projectId ?? current.projectId;
    const project = projectId ? await dataClient.documents.get(projectId) : null;
    if (project?.contract) {
      const statusField = project.contract.fields.find((field) => field.key === "status");
      const categoryField = project.contract.fields.find((field) => field.key === "category");
      const requestedStatus = input.status ?? current.status;
      const requestedCategory = input.type ?? current.type;
      const statusOption = statusField?.options.find((option) => option.value === requestedStatus);
      const categoryOption = categoryField?.options.find((option) => option.value === requestedCategory);

      if (!statusOption) {
        if (input.projectId === undefined) throw new Error("El estado no pertenece al contrato del Project.");
        next.status = contractFieldDefault(statusField, "later") as TlozMissionStatus;
      }
      if (!categoryOption) {
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
  return { canUpdate: authorizeTlozOperation(actor, "update", { ownerId: mission.ownerId }).allowed };
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
  const document = await dataClient.documents.get(missionId);
  if (!document || document.kind !== "mission") return { document: null, contract: [] };
  const project = document.parentId ? await dataClient.documents.get(document.parentId) : null;
  return {
    document,
    contract: project?.contract?.fields ?? [],
  };
}

export async function updateDocumentProperties(
  documentId: string,
  properties: Record<string, string | number | boolean | string[] | null>,
) {
  const document = await dataClient.documents.get(documentId);
  if (!document) throw new Error("Documento no encontrado.");
  if (document.kind === "mission" && document.source) await authorizeMission(document.source.id);
  else if (document.kind === "project" && document.source) await authorizeProject(document.source.id);
  else if (document.kind === "inventory" && document.source) await authorizeQuestItem(document.source.id);
  else await authenticatedActor();

  const updated = await dataClient.documents.update(
    document.id,
    { properties },
    document.revision,
  );
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
  await authorizeProject(projectId, Object.prototype.hasOwnProperty.call(input, "ownerId") ? "move" : "update");
  const value = await dataClient.tloz.updateProject(projectId, input);
  revalidateTloz();
  return value;
}

export async function updateQuestItem(itemId: string, input: TlozQuestItemUpdateInput) {
  await authorizeQuestItem(itemId, Object.prototype.hasOwnProperty.call(input, "ownerId") ? "move" : "update");
  const value = await dataClient.tloz.updateQuestItem(itemId, input);
  revalidateTloz();
  return value;
}

export async function replaceProjectContract(
  documentId: string,
  fields: TlozFieldDefinition[],
  revision: number,
) {
  const actor = await authenticatedActor();
  const document = await dataClient.documents.get(documentId);
  if (!document || document.kind !== "project") throw new Error("Project document not found.");
  assertTlozOperation(actor, "structure", {
    ownerId: typeof document.properties.owner === "string" ? document.properties.owner : null,
  });
  const value = await dataClient.documents.replaceProjectContract(document.id, fields, revision);
  revalidateTloz();
  return value;
}

export async function saveMissionDocument(missionId: string, markdown: string) {
  await authorizeMission(missionId);
  const mission = await dataClient.tloz.saveMissionDocument(missionId, markdown);
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
  const { mission: current } = await authorizeMission(missionId);
  const project = current.projectId ? await dataClient.documents.get(current.projectId) : null;
  const statusOption = project?.contract?.fields
    .find((field) => field.key === "status")
    ?.options.find((option) => option.value === status);
  if (project?.contract && !statusOption) {
    throw new Error("El estado no pertenece al contrato del Project.");
  }
  const mission = await dataClient.tloz.updateMission(missionId, {
    status,
    completedAt: (statusOption?.role === "done" || (!statusOption && status === "completed"))
      ? new Date().toISOString()
      : undefined,
  });
  revalidateTloz();
  return mission;
}

function contractFieldDefault(
  field: TlozFieldDefinition | undefined,
  fallback: string,
) {
  return typeof field?.defaultValue === "string"
    ? field.defaultValue
    : field?.options[0]?.value ?? fallback;
}

export async function deleteMission(missionId: string) {
  const actor = await authenticatedActor();
  assertTlozOperation(actor, "delete-mission");
  const mission = await dataClient.tloz.getMissionDetail(missionId);
  if (!mission) throw new Error("Misión no encontrada.");
  await dataClient.tloz.deleteMission(missionId);
  revalidateTloz();
}
