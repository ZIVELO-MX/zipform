import { dataClient, type TlozDashboardSummary, type TlozMissionDetail, type TlozMissionFilters, type TlozMissionRecord } from "@zipform/data";

export type { TlozDashboardSummary, TlozMissionDetail, TlozMissionRecord };

export function getTlozDashboardSummary(): Promise<TlozDashboardSummary> {
  return dataClient.tloz.getDashboardSummary();
}

export function getTlozMissions(filters?: TlozMissionFilters): Promise<TlozMissionRecord[]> {
  return dataClient.tloz.getMissions(filters);
}

export function getTlozMissionDetail(missionId: string): Promise<TlozMissionDetail | null> {
  return dataClient.tloz.getMissionDetail(missionId);
}

export const getTlozProjects = dataClient.tloz.getProjects;
export const getTlozSeasons = dataClient.tloz.getSeasons;
export const getTlozEpisodes = dataClient.tloz.getEpisodes;
export const getTlozQuestItems = dataClient.tloz.getQuestItems;
export const getTlozResources = dataClient.tloz.getResources;
export const getTlozUsers = dataClient.tloz.getUsers;
