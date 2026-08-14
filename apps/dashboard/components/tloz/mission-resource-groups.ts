import type { TlozResource } from "@tloz/types";

export type MissionResourceGroup = {
  groupKey: string;
  groupName: string;
  resources: TlozResource[];
};

export function attachmentGroupFallbackName(groupKey: string) {
  const readable = groupKey.trim().replace(/[._-]+/g, " ").replace(/\s+/g, " ");
  if (!readable) return "Grupo de capturas";
  return readable.charAt(0).toLocaleUpperCase("es-MX") + readable.slice(1);
}

export function groupMissionResources(resources: readonly TlozResource[]) {
  const groups = new Map<string, TlozResource[]>();
  const standalone: TlozResource[] = [];

  for (const resource of resources) {
    if (!resource.groupKey) {
      standalone.push(resource);
      continue;
    }
    const group = groups.get(resource.groupKey) ?? [];
    group.push(resource);
    groups.set(resource.groupKey, group);
  }

  return {
    groups: [...groups.entries()].map(([groupKey, items]): MissionResourceGroup => ({
      groupKey,
      groupName: items.find((item) => item.groupName?.trim())?.groupName?.trim() ?? attachmentGroupFallbackName(groupKey),
      resources: items,
    })),
    standalone,
  };
}
