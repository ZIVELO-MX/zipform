import { dataClient, type TlozDashboardSummary, type TlozMissionDetail, type TlozMissionRecord } from "@zipform/data";

export type { TlozDashboardSummary, TlozMissionDetail, TlozMissionRecord };

export function getTlozDashboardSummary(): Promise<TlozDashboardSummary> {
  return dataClient.tloz.getDashboardSummary();
}

export function getTlozMissions(): Promise<TlozMissionRecord[]> {
  return dataClient.tloz.getMissions();
}

export function getTlozMissionDetail(missionId: string): Promise<TlozMissionDetail | null> {
  return dataClient.tloz.getMissionDetail(missionId);
}

export const getTlozProjects = dataClient.tloz.getProjects;
export const getTlozSeasons = dataClient.tloz.getSeasons;
export const getTlozEpisodes = dataClient.tloz.getEpisodes;
export const getTlozQuestItems = dataClient.tloz.getQuestItems;
