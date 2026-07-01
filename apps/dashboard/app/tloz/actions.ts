"use server";

import { dataClient, type TlozMissionCreateInput, type TlozMissionUpdateInput, type TlozResourceInput } from "@zipform/data";
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
  const [missions, projects, seasons, episodes, questItems] = await Promise.all([
    dataClient.tloz.getMissions(), dataClient.tloz.getProjects(), dataClient.tloz.getSeasons(), dataClient.tloz.getEpisodes(), dataClient.tloz.getQuestItems()
  ]);
  const users = Array.from(new Map(missions.map((mission) => [mission.owner.id, mission.owner])).values());
  return { missions, projects, seasons, episodes, questItems, users };
}

export async function createProject(name: string) { const value = await dataClient.tloz.createProject(name); revalidateTloz(); return value; }
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

export async function patchMissionStatus(missionId: string, status: TlozMissionStatus) {
  const mission = await dataClient.tloz.patchMissionStatus(missionId, status);
  revalidateTloz();
  return mission;
}

export async function deleteMission(missionId: string) {
  await dataClient.tloz.deleteMission(missionId);
  revalidateTloz();
}
