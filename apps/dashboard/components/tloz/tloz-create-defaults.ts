import type { TlozCreateKind } from "./tloz-create";

export function initialDraft(kind: TlozCreateKind, ownerId: string, projectId: string, today: string) {
  return {
    name: "",
    description: "",
    icon: kind === "project" ? "FolderKanban" : kind === "inventory" ? "PackageOpen" : "Sword",
    ownerId,
    projectId,
    type: "side_quest",
    status: kind === "inventory" ? "locked" : kind === "project" ? "active" : "later",
    category: "other",
    color: "#2D6CDF",
    projectType: "normal",
    startDate: kind === "project" ? today : "",
    dueDate: "",
  };
}
