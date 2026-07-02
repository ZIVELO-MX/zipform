"use server";

import { dataClient, type TlozMissionCreateInput, type TlozMissionUpdateInput, type TlozProjectCreateInput, type TlozProjectUpdateInput, type TlozQuestItemCreateInput, type TlozQuestItemUpdateInput, type TlozResourceInput } from "@zipform/data";
import type { TlozMissionStatus } from "@zipform/types";
import { revalidatePath } from "next/cache";

const revalidateTloz = () => revalidatePath("/tloz", "layout");

export async function createMission(input: TlozMissionCreateInput) {
  const mission = await dataClient.tloz.createMission(input);
  revalidateTloz();
  return mission;
}

export async function updateMission(missionId: string, input: TlozMissionUpdateInput) {
  const mission = await dataClient.tloz.updateMission(missionId, input);
  revalidateTloz();
  return mission;
}

export async function getMissionDetail(missionId: string) {
  return dataClient.tloz.getMissionDetail(missionId);
}

export async function getMissionDetailOptions() {
  const [missions, projects, seasons, episodes, questItems, users] = await Promise.all([
    dataClient.tloz.getMissions(), dataClient.tloz.getProjects(), dataClient.tloz.getSeasons(), dataClient.tloz.getEpisodes(), dataClient.tloz.getQuestItems(), dataClient.tloz.getUsers()
  ]);
  return { missions, projects, seasons, episodes, questItems, users };
}
export async function getEntityResources(kind: "project" | "inventory", entityId: string) {
  const resources = await dataClient.tloz.getResources();
  return resources.filter((resource) => kind === "project" ? resource.projectId === entityId : resource.questItemId === entityId);
}
export async function getTlozDetailUsers() { return dataClient.tloz.getUsers(); }

export async function createProject(input: TlozProjectCreateInput | string) {
  const value = typeof input === "string" ? await dataClient.tloz.createProject({ name: input, description: "", icon: "FolderKanban", color: "#6B6B6B", status: "active", type: "normal", ownerId: (await dataClient.user.getCurrent()).id, startDate: new Date().toISOString().slice(0, 10) }) : await dataClient.tloz.createProject(input);
  revalidateTloz(); return value;
}
export async function createQuestItem(input: TlozQuestItemCreateInput) { const value = await dataClient.tloz.createQuestItem(input); revalidateTloz(); return value; }
export async function updateProject(projectId: string, input: TlozProjectUpdateInput) { const value = await dataClient.tloz.updateProject(projectId, input); revalidateTloz(); return value; }
export async function updateQuestItem(itemId: string, input: TlozQuestItemUpdateInput) { const value = await dataClient.tloz.updateQuestItem(itemId, input); revalidateTloz(); return value; }
export async function createSeason(name: string) { const value = await dataClient.tloz.createSeason(name); revalidateTloz(); return value; }
export async function createEpisode(name: string, seasonId: string) { const value = await dataClient.tloz.createEpisode(name, seasonId); revalidateTloz(); return value; }

export async function saveMissionDocument(missionId: string, markdown: string) {
  const mission = await dataClient.tloz.saveMissionDocument(missionId, markdown);
  revalidateTloz();
  return mission;
}

export async function addMissionDependency(missionId: string, dependsOnMissionId: string) {
  const mission = await dataClient.tloz.addMissionDependency(missionId, dependsOnMissionId); revalidateTloz(); return mission;
}
export async function removeMissionDependency(missionId: string, dependsOnMissionId: string) {
  const mission = await dataClient.tloz.removeMissionDependency(missionId, dependsOnMissionId); revalidateTloz(); return mission;
}
export async function setMissionQuestItem(missionId: string, questItemId: string, required: boolean) {
  const mission = await dataClient.tloz.setMissionQuestItem(missionId, questItemId, required); revalidateTloz(); return mission;
}
export async function removeMissionQuestItem(missionId: string, questItemId: string) {
  const mission = await dataClient.tloz.removeMissionQuestItem(missionId, questItemId); revalidateTloz(); return mission;
}
export async function addMissionResource(missionId: string, input: TlozResourceInput) {
  const mission = await dataClient.tloz.addMissionResource(missionId, input); revalidateTloz(); return mission;
}
export async function removeMissionResource(missionId: string, resourceId: string) {
  const mission = await dataClient.tloz.removeMissionResource(missionId, resourceId); revalidateTloz(); return mission;
}
export async function addProjectResource(projectId: string, input: TlozResourceInput) { const value = await dataClient.tloz.addProjectResource(projectId, input); revalidateTloz(); return value; }
export async function removeProjectResource(projectId: string, resourceId: string) { const value = await dataClient.tloz.removeProjectResource(projectId, resourceId); revalidateTloz(); return value; }
export async function addQuestItemResource(itemId: string, input: TlozResourceInput) { const value = await dataClient.tloz.addQuestItemResource(itemId, input); revalidateTloz(); return value; }
export async function removeQuestItemResource(itemId: string, resourceId: string) { const value = await dataClient.tloz.removeQuestItemResource(itemId, resourceId); revalidateTloz(); return value; }

export async function patchMissionStatus(missionId: string, status: TlozMissionStatus) {
  const mission = await dataClient.tloz.patchMissionStatus(missionId, status);
  revalidateTloz();
  return mission;
}

export async function deleteMission(missionId: string) {
  await dataClient.tloz.deleteMission(missionId);
  revalidateTloz();
}
