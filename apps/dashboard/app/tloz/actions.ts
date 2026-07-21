"use server";

import {
  dataClient,
  type TlozMissionCreateInput,
  type TlozMissionUpdateInput,
  type TlozProjectCreateInput,
  type TlozProjectUpdateInput,
  type TlozQuestItemCreateInput,
  type TlozQuestItemUpdateInput,
  type TlozResourceInput,
} from "@zipform/data";
import type { TlozMissionStatus } from "@zipform/types";
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

const revalidateTloz = () => revalidatePath("/tloz", "layout");

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

export async function createMission(input: TlozMissionCreateInput) {
  const actor = await authenticatedActor();
  assertTlozOperation(actor, "create", { requestedOwnerId: input.ownerId });
  const mission = await dataClient.tloz.createMission(input);
  revalidateTloz();
  return mission;
}

export async function updateMission(missionId: string, input: TlozMissionUpdateInput) {
  const changesPlacement = ["ownerId", "projectId", "seasonId", "episodeId"]
    .some((field) => Object.prototype.hasOwnProperty.call(input, field));
  await authorizeMission(missionId, changesPlacement ? "move" : "update");
  const mission = await dataClient.tloz.updateMission(missionId, input);
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
  const [missions, projects, seasons, episodes, questItems, users] = await Promise.all([
    dataClient.tloz.getMissions(),
    dataClient.tloz.getProjects(),
    dataClient.tloz.getSeasons(),
    dataClient.tloz.getEpisodes(),
    dataClient.tloz.getQuestItems(),
    dataClient.tloz.getUsers(),
  ]);
  return isReadOnlyAgent(actor)
    ? { missions: missions.map(toPublicMissionOwner), projects, seasons, episodes, questItems, users: users.map(toPublicUserProfile) }
    : { missions, projects, seasons, episodes, questItems, users };
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

export async function createSeason(name: string) {
  const actor = await authenticatedActor();
  assertTlozOperation(actor, "structure");
  const value = await dataClient.tloz.createSeason(name);
  revalidateTloz();
  return value;
}

export async function createEpisode(name: string, seasonId: string) {
  const actor = await authenticatedActor();
  assertTlozOperation(actor, "structure");
  const value = await dataClient.tloz.createEpisode(name, seasonId);
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
  await authorizeMission(missionId);
  const mission = await dataClient.tloz.patchMissionStatus(missionId, status);
  revalidateTloz();
  return mission;
}

export async function deleteMission(missionId: string) {
  const actor = await authenticatedActor();
  assertTlozOperation(actor, "delete-mission");
  const mission = await dataClient.tloz.getMissionDetail(missionId);
  if (!mission) throw new Error("Misión no encontrada.");
  await dataClient.tloz.deleteMission(missionId);
  revalidateTloz();
}
