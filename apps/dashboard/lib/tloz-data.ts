import { dataClient, type TlozDashboardSummary, type TlozMissionDetail, type TlozMissionRecord } from "@zipform/data";
import type { TlozAttachmentGroup } from "@zipform/types";
import { cache } from "react";
import { getTlozAttachmentStorage } from "./tloz-attachment-storage";

export type { TlozDashboardSummary, TlozMissionDetail, TlozMissionRecord };

export const getTlozDashboardSummary = cache(() => dataClient.tloz.getDashboardSummary());
export const getTlozMissions = cache(() => dataClient.tloz.getMissions());
export const getTlozMissionDetail = cache((missionId: string) => dataClient.tloz.getMissionDetail(missionId));
export const getTlozMissionDetailWithAttachments = cache(async (missionId: string) => {
  const [mission, groups] = await Promise.all([
    dataClient.tloz.getMissionDetail(missionId),
    dataClient.tloz.getAttachmentGroups(missionId),
  ]);
  if (!mission || groups.length === 0) return mission;
  return hydrateTlozMissionResources(mission, groups, (path) => getTlozAttachmentStorage().createSignedRead(path, 3600));
});

export async function hydrateTlozMissionResources(
  mission: TlozMissionDetail,
  groups: TlozAttachmentGroup[],
  createSignedRead: (path: string) => Promise<string>,
): Promise<TlozMissionDetail> {
  const attachments = new Map(groups.flatMap((group) => group.attachments.map((attachment) => [attachment.id, attachment] as const)));
  const resources = await Promise.all(mission.resources.map(async (resource) => {
    const attachment = attachments.get(resource.id);
    if (!attachment?.storagePath || resource.url) return resource;
    try {
      return { ...resource, url: await createSignedRead(attachment.storagePath) };
    } catch {
      return resource;
    }
  }));
  return { ...mission, resources };
}
export const getTlozProjects = cache(() => dataClient.tloz.getProjects());
export const getTlozSeasons = cache(() => dataClient.tloz.getSeasons());
export const getTlozEpisodes = cache(() => dataClient.tloz.getEpisodes());
export const getTlozQuestItems = cache(() => dataClient.tloz.getQuestItems());
export const getTlozResources = cache(() => dataClient.tloz.getResources());
export const getTlozUsers = cache(() => dataClient.tloz.getUsers());
