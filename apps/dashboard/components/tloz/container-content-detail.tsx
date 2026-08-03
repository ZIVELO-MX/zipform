"use client";

import type { TlozResource, TlozDocumentScalar, TlozDocumentUpdate, TlozFieldDefinition, TlozDocumentPresentationField, ContainerRecord, ContentRecord, UserProfile } from "@tloz/types";
import type { TlozResourceInput } from "@tloz/data";
import { useMemo, useState } from "react";
import { MissionDetail, type MissionDetailOptions } from "./mission-detail";
import { documentToDetailMission } from "./document-view-renderer";
import { resolveDocumentDetailPropertyProjection } from "./document-view-model";
import { apiErrorMessage, canonicalCompletionDate, canonicalContentDocument, canonicalContentHref } from "./container-content-view-model";

/** Canonical content detail deliberately delegates to the same MissionDetail used by Project and Inventory. */
export function ContainerContentDetail({
  container,
  content: initialContent,
  users,
  onChange,
  variant = "panel",
}: {
  container: ContainerRecord;
  content: ContentRecord;
  users: UserProfile[];
  onChange?: (content: ContentRecord) => void;
  variant?: "panel" | "full";
}) {
  const [content, setContent] = useState(initialContent);
  const document = useMemo(() => canonicalContentDocument(content, container), [content, container]);
  const definition = useMemo(() => toDefinition(container), [container]);
  const mission = useMemo(() => documentToDetailMission(document, users, resourcesFrom(content)), [document, users, content]);
  const options = useMemo<MissionDetailOptions>(() => ({
    projects: mission.project ? [mission.project] : [],
    users,
    missions: [],
    questItems: [],
    document,
    contract: definition.fields.map(toContractField),
    presentationFields: definition.fields,
    detailProperties: resolveDocumentDetailPropertyProjection(document, definition),
    hideEmptyFields: true,
  }), [definition, document, mission.project, users]);

  async function mutate(input: TlozDocumentUpdate) {
    const nextData = dataForUpdate(content, input);
    const response = await fetch(`/api/v2/contents/${encodeURIComponent(content.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "If-Match": `"${content.revision}"` },
      body: JSON.stringify({
        ...(input.title === undefined ? {} : { title: input.title }),
        ...(input.summary === undefined ? {} : { summary: input.summary }),
        ...(input.body === undefined ? {} : { body: input.body }),
        ...(input.properties || input.title || input.summary || input.body ? { data: nextData } : {}),
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(apiErrorMessage(payload, "No se pudo guardar el contenido."));
    const updated = (payload as { data: ContentRecord }).data;
    setContent(updated);
    onChange?.(updated);
    return documentToDetailMission(canonicalContentDocument(updated, container), users, resourcesFrom(updated));
  }

  async function updateResources(update: (resources: TlozResource[]) => TlozResource[]) {
    const resources = update(resourcesFrom(content));
    const next = await mutate({ properties: { resources: resources as unknown as TlozDocumentScalar } });
    return next.resources;
  }

  return (
    <MissionDetail
      mission={mission}
      options={options}
      canUpdate={false}
      canMove={false}
      canUpdateDocument
      documentMutation={mutate}
      onAddResource={async (input: TlozResourceInput) => updateResources((resources) => [...resources, createResource(input, content)])}
      onRemoveResource={async (resourceId: string) => updateResources((resources) => resources.filter((resource) => resource.id !== resourceId))}
      fullDetailHref={canonicalContentHref(content.presentation, content.publicId)}
      variant={variant}
    />
  );
}

function toDefinition(container: ContainerRecord) {
  return {
    id: container.id,
    key: container.presentation,
    kind: container.presentation === "workshop" ? "project" as const : "inventory" as const,
    scope: "collection" as const,
    fields: container.definition.fields.map((field, position) => ({
      key: field.key,
      label: field.label,
      format: presentationFormat(field.format),
      position,
      visible: field.visible ?? true,
      options: field.options,
    })),
    views: container.definition.views.map((view) => ({ ...view, id: view.id as "detail" })),
    defaultView: "detail" as const,
  };
}

function presentationFormat(format: string): TlozDocumentPresentationField["format"] {
  if (format === "status" || format === "date" || format === "person" || format === "number" || format === "id") return format;
  return "text";
}

function toContractField(field: TlozDocumentPresentationField): TlozFieldDefinition {
  const type = field.format === "status" ? "select" : field.format === "person" ? "person" : field.format === "date" ? "date" : field.format === "number" ? "number" : "text";
  return { id: field.key, key: field.key, label: field.label, type, required: false, visible: field.visible, position: field.position, options: field.options ?? [] };
}

function dataForUpdate(content: ContentRecord, input: TlozDocumentUpdate) {
  const data = { ...content.data };
  if (!input.properties) return data;
  for (const [key, value] of Object.entries(input.properties)) {
    const canonical = key === "owner" || key === "assignee" ? "ownerId" : key === "start" ? "startDate" : key === "due" ? "dueDate" : key === "acquired" ? "acquiredAt" : key;
    data[canonical] = value as ContentRecord["data"][string];
    if (content.presentation === "library" && canonical === "status") {
      data.acquiredAt = canonicalCompletionDate(content.presentation, String(value)) ?? null;
    }
  }
  return data;
}

function resourcesFrom(content: ContentRecord): TlozResource[] {
  const value = content.data.resources;
  if (!Array.isArray(value)) return [];
  return value.filter((resource): resource is TlozResource => Boolean(resource && typeof resource === "object" && typeof (resource as { id?: unknown }).id === "string"));
}

function createResource(input: TlozResourceInput, content: ContentRecord): TlozResource {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), ...input, createdAt: now, updatedAt: now, projectId: content.containerId };
}
