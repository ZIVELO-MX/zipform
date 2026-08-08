import type { ContainerContentData, ContainerDefinition, ContainerRecord, ContentRecord, TlozDocument, TlozDocumentKind, TlozDocumentScalar } from "@tloz/types";
import type { TlozView } from "../../lib/tloz-routes";
import type { TlozControlKind } from "./tloz-control-capabilities";
import type { TlozUiState } from "./tloz-view-state";

export function contentValue(content: ContentRecord, key: string) {
  if (key === "publicId") return content.publicId;
  if (key === "title") return content.title;
  if (key === "summary") return content.summary;
  if (key === "body") return content.body;
  return content.data[key] ?? null;
}

export function filterAndSortContents(
  contents: ContentRecord[],
  state: TlozUiState,
  definition: ContainerDefinition,
) {
  const statusField = definition.fields.find((field) => field.key === "status");
  const doneStatuses = new Set(
    (statusField?.options ?? [])
      .filter((option) => option.role === "done")
      .map((option) => option.value),
  );
  const visible = contents.filter((content) => {
    const ownerId = content.data.ownerId;
    const status = content.data.status;
    return (state.ownerId === "all" || ownerId === state.ownerId)
      && (state.showCompleted || typeof status !== "string" || !doneStatuses.has(status));
  });

  if (state.sort === "default") return visible;
  return [...visible].sort((left, right) => {
    if (state.sort === "title") return left.title.localeCompare(right.title);
    const key = state.sort === "acquired-date" ? "acquiredAt" : "dueDate";
    return String(contentValue(left, key) ?? "9999-12-31")
      .localeCompare(String(contentValue(right, key) ?? "9999-12-31"));
  });
}

export function apiErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const error = (payload as { error?: unknown }).error;
  if (!error || typeof error !== "object") return fallback;
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" && message ? message : fallback;
}

export function canonicalControlKind(presentation: string): TlozControlKind {
  return presentation === "workshop" ? "project" : "inventory";
}

export function canonicalCollectionViews(definition: ContainerDefinition): TlozView[] {
  return definition.views
    .map((view) => view.id)
    .filter((view): view is TlozView => view === "list" || view === "table");
}

export function canonicalCollectionFields(presentation: string) {
  const dateField = presentation === "library" ? "acquiredAt" : "dueDate";
  return ["icon", "publicId", "title", "project", "ownerId", dateField];
}

export function canonicalContentIcon(presentation: string, data: Record<string, ContainerContentData>) {
  return typeof data.icon === "string" && data.icon
    ? data.icon
    : presentation === "library" ? "BookOpen" : "Lightbulb";
}

export function canonicalContentHref(presentation: string, publicId: string) {
  return `/${presentation}/${encodeURIComponent(publicId)}`;
}

export function canonicalCompletionDate(presentation: string, status: string, today = new Date().toISOString().slice(0, 10)) {
  if (presentation !== "library") return undefined;
  return status === "unlocked" ? today : null;
}

export function canonicalContentDocument(content: ContentRecord, container: ContainerRecord): TlozDocument {
  const kind: TlozDocumentKind = content.presentation === "workshop" ? "project" : content.presentation === "library" ? "inventory" : "mission";
  const raw = Object.fromEntries(Object.entries(content.data).flatMap(([key, value]) => (
    value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean" || (Array.isArray(value) && value.every((item) => typeof item === "string"))
      ? [[key, value as TlozDocumentScalar]]
      : []
  )));
  const properties = kind === "project"
    ? { ...raw, owner: raw.owner ?? raw.ownerId, start: raw.start ?? raw.startDate, due: raw.due ?? raw.dueDate }
    : kind === "inventory"
      ? { ...raw, assignee: raw.assignee ?? raw.ownerId, acquired: raw.acquired ?? raw.acquiredAt }
      : raw;
  properties.icon ??= canonicalContentIcon(content.presentation, content.data);
  return {
    id: content.id,
    publicId: content.publicId,
    kind,
    parentId: container.id,
    parentPublicId: container.publicId,
    projectSlug: container.slug,
    title: content.title,
    summary: content.summary,
    body: content.body,
    revision: content.revision,
    properties,
    source: { type: kind, id: content.id },
    createdAt: content.createdAt,
    updatedAt: content.updatedAt,
  };
}

export function createContentPayload(
  container: ContainerRecord,
  title: string,
  data: Record<string, ContainerContentData>,
  publicId: string,
) {
  return {
    publicId,
    containerId: container.id,
    presentation: container.presentation,
    title: title.trim(),
    data,
  };
}
