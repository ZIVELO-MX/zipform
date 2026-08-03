import type {
  TlozDocumentScalar,
  TlozFieldDefinition,
  TlozInventoryCategory,
  TlozMissionStatus,
  TlozMissionType,
} from "@tloz/types";
import type { TlozResourceInput } from "@tloz/data";

export function buildCreateInput(kind: "mission" | "project" | "inventory" | "workshop" | "library", draft: Record<string, string>, resources: TlozResourceInput[] = []) {
  if (kind === "mission") return {
    title: draft.name,
    description: draft.description,
    descriptionDetail: draft.descriptionDetail,
    icon: draft.icon,
    type: draft.type as TlozMissionType,
    status: draft.status as TlozMissionStatus,
    ownerId: draft.ownerId,
    projectId: draft.projectId,
    startDate: draft.startDate || undefined,
    dueDate: draft.dueDate || undefined,
    progress: 0,
    dependencyIds: splitCreateIds(draft.dependencyIds),
    requiredQuestItemIds: splitCreateIds(draft.requiredQuestItemIds),
    resources,
  };
  if (kind === "project") return { name: draft.name, description: draft.description, icon: draft.icon, color: draft.color, status: "active" as const, type: "normal" as const, ownerId: draft.ownerId, startDate: draft.startDate, dueDate: draft.dueDate || undefined };
  return { name: draft.name, description: draft.description, icon: draft.icon, color: draft.color, status: "locked" as const, category: draft.category as TlozInventoryCategory, ownerId: draft.ownerId || undefined };
}

export function splitCreateIds(value?: string) {
  return value ? value.split(",").filter(Boolean) : [];
}

export function documentPropertyDefaults(fields: TlozFieldDefinition[]) {
  return Object.fromEntries(
    fields
      .filter((field) => field.key !== "status" && field.key !== "category")
      .filter((field) => field.defaultValue !== undefined)
      .map((field) => [field.key, field.defaultValue as TlozDocumentScalar]),
  );
}
