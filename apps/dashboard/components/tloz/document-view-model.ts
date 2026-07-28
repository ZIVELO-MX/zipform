import type {
  TlozDocument,
  TlozDocumentDefinition,
  TlozDocumentKind,
  TlozDocumentPresentationField,
  TlozDocumentScalar,
  UserProfile,
} from "@tloz/types";
import type { MissionViewRecord } from "./mission-views";

export type TlozDetailCoreProperty =
  | "status"
  | "category"
  | "responsible"
  | "project"
  | "start"
  | "due";

export type TlozDetailSystemProperty =
  | "status"
  | "category"
  | "owner"
  | "assignee"
  | "project"
  | "start"
  | "due"
  | "progress"
  | "blocked_reason"
  | "acquired"
  | "mission_count";

export type TlozDetailPropertyProjection = {
  core: TlozDetailCoreProperty[];
  fields: TlozDocumentPresentationField[];
};

export const DOCUMENT_DETAIL_PROPERTY_MATRIX = {
  mission: ["status", "category", "assignee", "project", "start", "due"],
  project: ["status", "category", "owner", "start", "due", "mission_count"],
  inventory: ["status", "category", "assignee", "acquired"],
} as const satisfies Record<TlozDocumentKind, readonly TlozDetailSystemProperty[]>;

export const DEFAULT_MISSION_DETAIL_CORE_PROPERTIES = [
  "status",
  "category",
  "responsible",
  "project",
  "start",
  "due",
] as const satisfies readonly TlozDetailCoreProperty[];

const CORE_PROPERTY_BY_KEY: Partial<
  Record<TlozDetailSystemProperty, TlozDetailCoreProperty>
> = {
  status: "status",
  category: "category",
  owner: "responsible",
  assignee: "responsible",
  project: "project",
  start: "start",
  due: "due",
};

const SYSTEM_DETAIL_PROPERTIES = new Set<TlozDetailSystemProperty>([
  "status",
  "category",
  "owner",
  "assignee",
  "project",
  "start",
  "due",
  "progress",
  "blocked_reason",
  "acquired",
  "mission_count",
]);

const DETAIL_HEADER_PROPERTIES = new Set(["publicId", "title"]);

export function documentValue(document: TlozDocument, key: string): TlozDocumentScalar {
  if (key === "title") return document.title;
  if (key === "publicId") return document.publicId;
  if (key === "project") return document.parentId ?? null;
  if (key === "mission_count" && document.children) return document.children.total;
  return document.properties[key] ?? null;
}

export function isDocumentDetailValuePresent(value: TlozDocumentScalar) {
  return value !== null
    && value !== ""
    && (!Array.isArray(value) || value.length > 0);
}

export function resolveDocumentDetailPropertyProjection(
  document: TlozDocument,
  definition: TlozDocumentDefinition,
): TlozDetailPropertyProjection {
  const detail = definition.views.find((view) => view.id === "detail");
  const configuredKeys = detail?.fields ?? [];
  const allowedSystemKeys = new Set<TlozDetailSystemProperty>(
    DOCUMENT_DETAIL_PROPERTY_MATRIX[document.kind],
  );
  const fieldsByKey = new Map(definition.fields.map((field) => [field.key, field]));

  const core = DOCUMENT_DETAIL_PROPERTY_MATRIX[document.kind]
    .flatMap((key) => {
      const property = CORE_PROPERTY_BY_KEY[key];
      return property && isDocumentDetailValuePresent(documentValue(document, key))
        ? [property]
        : [];
    })
    .filter((property, index, properties) => properties.indexOf(property) === index);

  const fields = configuredKeys.flatMap((key, position) => {
    if (DETAIL_HEADER_PROPERTIES.has(key) || CORE_PROPERTY_BY_KEY[key as TlozDetailSystemProperty]) {
      return [];
    }
    const systemKey = key as TlozDetailSystemProperty;
    if (SYSTEM_DETAIL_PROPERTIES.has(systemKey) && !allowedSystemKeys.has(systemKey)) {
      return [];
    }
    const field = fieldsByKey.get(key) ?? fallbackDetailField(key, position);
    return field.visible ? [field] : [];
  });

  return { core, fields };
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

function fallbackDetailField(
  key: string,
  position: number,
): TlozDocumentPresentationField {
  const formats: Partial<Record<TlozDetailSystemProperty, TlozDocumentPresentationField["format"]>> = {
    acquired: "date",
    blocked_reason: "text",
    due: "date",
    mission_count: "number",
    progress: "number",
    start: "date",
  };
  return {
    key,
    label: key.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    format: formats[key as TlozDetailSystemProperty] ?? "text",
    position,
    visible: true,
  };
}
