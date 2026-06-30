"use server";

import { dataClient, type TlozMissionCreateInput, type TlozMissionUpdateInput } from "@zipform/data";
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

export async function patchMissionStatus(missionId: string, status: TlozMissionStatus) {
  const mission = await dataClient.tloz.patchMissionStatus(missionId, status);
  revalidateTloz();
  return mission;
}

export async function deleteMission(missionId: string) {
  await dataClient.tloz.deleteMission(missionId);
  revalidateTloz();
}
