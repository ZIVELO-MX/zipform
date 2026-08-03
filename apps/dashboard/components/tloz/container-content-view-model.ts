import type { ContainerContentData, ContainerDefinition, ContainerRecord, ContentRecord } from "@tloz/types";
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
