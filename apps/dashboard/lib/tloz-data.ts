import { dataClient, type TlozDashboardSummary, type TlozMissionDetail, type TlozMissionRecord } from "@zipform/data";
import { cache } from "react";

export type { TlozDashboardSummary, TlozMissionDetail, TlozMissionRecord };

export const getTlozDashboardSummary = cache(() => dataClient.tloz.getDashboardSummary());
export const getTlozMissions = cache(() => dataClient.tloz.getMissions());
export const getTlozMissionDetail = cache((missionId: string) => dataClient.tloz.getMissionDetail(missionId));
export const getTlozProjects = cache(() => dataClient.tloz.getProjects());
export const getTlozSeasons = cache(() => dataClient.tloz.getSeasons());
export const getTlozEpisodes = cache(() => dataClient.tloz.getEpisodes());
export const getTlozQuestItems = cache(() => dataClient.tloz.getQuestItems());
export const getTlozResources = cache(() => dataClient.tloz.getResources());
export const getTlozUsers = cache(() => dataClient.tloz.getUsers());
