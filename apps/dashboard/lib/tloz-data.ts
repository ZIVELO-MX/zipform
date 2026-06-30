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

export async function getTlozMissionFilters(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const params = await searchParams;
  const currentUser = params.mine === "1" ? await dataClient.user.getCurrent() : null;
  return {
    projectId: typeof params.project === "string" ? params.project : undefined,
    seasonId: typeof params.season === "string" ? params.season : undefined,
    episodeId: typeof params.episode === "string" ? params.episode : undefined,
    ownerId: currentUser?.id
  } satisfies TlozMissionFilters;
}

export const getTlozProjects = dataClient.tloz.getProjects;
export const getTlozSeasons = dataClient.tloz.getSeasons;
export const getTlozEpisodes = dataClient.tloz.getEpisodes;
export const getTlozQuestItems = dataClient.tloz.getQuestItems;
