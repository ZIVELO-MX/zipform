import { dataClient, type TlozDashboardSummary, type TlozMissionDetail, type TlozMissionRecord, type ContainerRecord, type ContentRecord } from "@tloz/data";
import type { TlozAttachmentGroup, TlozDocumentKind } from "@tloz/types";
import type { DocumentGetOptions } from "@tloz/data";
import { cache } from "react";
import { getTlozAttachmentStorage } from "./tloz-attachment-storage";

export type { TlozDashboardSummary, TlozMissionDetail, TlozMissionRecord };

export const getTlozDashboardSummary = cache(() => dataClient.tloz.getDashboardSummary());
export const getTlozMissions = cache(() => dataClient.tloz.getMissions());
export const getTlozMissionDetail = cache((missionId: string) => dataClient.tloz.getMissionDetail(missionId));
export const getTlozMissionDetailWithAttachments = cache(async (missionId: string) => {
  const mission = await dataClient.tloz.getMissionDetail(missionId);
  if (!mission) return mission;
  const groups = await dataClient.tloz.getAttachmentGroups(mission.id);
  if (groups.length === 0) return mission;
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
export const getTlozQuestItems = cache(() => dataClient.tloz.getQuestItems());
export const getTlozResources = cache(() => dataClient.tloz.getResources());
export const getTlozUsers = cache(() => dataClient.tloz.getUsers());
export const getTlozDocuments = cache((kind?: TlozDocumentKind, parentId?: string) => (
  dataClient.canonicalDocuments.find({ ...(kind ? { kind } : {}), ...(parentId ? { parentId } : {}) }, { limit: 100 })
));
export const getTlozProjectDocuments = () => getTlozDocuments("project");
export const getTlozInventoryDocuments = () => getTlozDocuments("inventory");
export const getTlozDocument = cache((
  documentId: string,
  options?: DocumentGetOptions,
) => dataClient.canonicalDocuments.get(documentId, options));
export const getTlozDocumentDefinition = cache((
  definitionKey: string,
) => dataClient.canonicalDocuments.getDefinition(definitionKey));

export const getCanonicalContainer = cache(async (publicId: string) => (
  await dataClient.containerContent.getContainer(publicId)
    ?? (await dataClient.containerContent.listContainers()).find((container) => container.publicId === publicId)
));

export const getCanonicalContents = cache((containerId: string) => dataClient.containerContent.listContents({ containerId }));
export type { ContainerRecord, ContentRecord };
