import type {
  TlozDocument,
  TlozDocumentPresentationField,
  TlozDocumentScalar,
  UserProfile,
} from "@tloz/types";
import type { MissionViewRecord } from "./mission-views";

export function documentValue(document: TlozDocument, key: string): TlozDocumentScalar {
  if (key === "title") return document.title;
  if (key === "publicId") return document.publicId;
  if (key === "mission_count" && document.children) return document.children.total;
  return document.properties[key] ?? null;
}

export function resolveVisibleDocumentFields(
  documents: TlozDocument[],
  fieldKeys: string[],
  fieldsByKey: Map<string, TlozDocumentPresentationField>,
) {
  return fieldKeys
    .map((key) => fieldsByKey.get(key))
    .filter((field): field is TlozDocumentPresentationField => Boolean(field?.visible))
    .filter((field) => (
      field.key === "title"
      || documents.some((document) => documentValue(document, field.key) !== null)
    ));
}

const unassignedUser: UserProfile = {
  id: "unassigned",
  name: "Sin responsable",
  username: "",
  email: "",
  role: "",
  type: "human",
  avatarUrl: "",
  theme: "system",
};

export function documentToMissionView(
  document: TlozDocument,
  users: UserProfile[],
): MissionViewRecord {
  const ownerId = stringProperty(document, "owner") ?? stringProperty(document, "assignee") ?? "unassigned";
  const owner = users.find((candidate) => candidate.id === ownerId) ?? { ...unassignedUser, id: ownerId };
  const tone = stringProperty(document, "color") ?? (document.kind === "project" ? "#D72228" : "#7A5A12");
  const icon = stringProperty(document, "icon") ?? (document.kind === "project" ? "FolderKanban" : "PackageOpen");
  const containerName = document.kind === "project" ? "Projects" : "Inventory";
  const containerId = document.parentId ?? `${document.kind}-container`;

  return {
    id: document.id,
    displayId: document.publicId,
    title: document.title,
    description: document.summary,
    descriptionDetail: document.body,
    icon,
    type: stringProperty(document, "category") ?? document.kind,
    status: stringProperty(document, "status") ?? "later",
    ownerId,
    projectId: containerId,
    startDate: stringProperty(document, "start") ?? undefined,
    dueDate: stringProperty(document, "due") ?? undefined,
    completedAt: undefined,
    blockedReason: stringProperty(document, "blocked_reason") ?? undefined,
    progress: numberProperty(document, "progress") ?? 0,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    project: {
      id: containerId,
      slug: document.projectSlug ?? document.kind,
      name: containerName,
      description: "",
      descriptionDetail: "",
      color: tone,
      icon,
      status: "active",
      type: "system",
      ownerId,
      startDate: document.createdAt.slice(0, 10),
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    },
    dependencies: [],
    questItems: [],
    requiredQuestItems: [],
    owner,
    presentation: {
      typeLabel: document.kind === "project" ? "Project" : "Inventory",
      typeTone: tone,
      icon,
    },
  };
}

function stringProperty(document: TlozDocument, key: string) {
  const value = document.properties[key];
  return typeof value === "string" && value ? value : null;
}

function numberProperty(document: TlozDocument, key: string) {
  const value = document.properties[key];
  return typeof value === "number" ? value : null;
}
