import type {
  TlozDocument,
  TlozDocumentDefinition,
  TlozDocumentPresentationField,
} from "@tloz/types";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_MISSION_DETAIL_CORE_PROPERTIES,
  DOCUMENT_DETAIL_PROPERTY_MATRIX,
  documentToMissionView,
  documentValue,
  isDocumentDetailValuePresent,
  resolveDocumentDetailPropertyProjection,
  resolveDocumentDetailColor,
  resolveDocumentRecordSelection,
  resolveVisibleDocumentFields,
} from "./document-view-model";

const fields: TlozDocumentPresentationField[] = [
  { key: "title", label: "Title", format: "text", position: 0, visible: true },
  { key: "due", label: "Due", format: "date", position: 1, visible: true },
  { key: "assignee", label: "Assignee", format: "person", position: 2, visible: true },
  { key: "hidden", label: "Hidden", format: "text", position: 3, visible: false },
];

const documents: TlozDocument[] = [
  document("INV-0001", { due: null, assignee: null }),
  document("INV-0002", { due: null, assignee: "user-1" }),
];

describe("document view model", () => {
  it("keeps useful columns and removes fields that are null for every document", () => {
    const visible = resolveVisibleDocumentFields(
      documents,
      ["title", "due", "assignee", "hidden"],
      new Map(fields.map((field) => [field.key, field])),
    );

    expect(visible.map((field) => field.key)).toEqual(["title", "assignee"]);
  });

  it("reads common and configured values through the same accessor", () => {
    expect(documentValue(documents[0], "title")).toBe("Item INV-0001");
    expect(documentValue(documents[0], "publicId")).toBe("INV-0001");
    expect(documentValue(documents[0], "due")).toBeNull();
  });

  it("reads child totals as the project mission count", () => {
    const project = {
      ...document("project-tloz", {}),
      kind: "project" as const,
      children: { data: [], nextCursor: null, total: 12 },
    };

    expect(documentValue(project, "mission_count")).toBe(12);
  });

  it("adapts Projects and Inventory to the Mission view contract", () => {
    const project = {
      ...document("project-tloz", {
        status: "active",
        owner: "user-1",
        color: "#D72228",
        icon: "FolderKanban",
      }),
      kind: "project" as const,
    };
    const record = documentToMissionView(project, [{
      id: "user-1",
      name: "Zelda",
      username: "zelda",
      email: "zelda@example.com",
      role: "Platform Owner",
      type: "human",
      avatarUrl: "",
      theme: "system",
    }]);

    expect(record).toMatchObject({
      displayId: "project-tloz",
      title: "Item project-tloz",
      status: "active",
      owner: { name: "Zelda" },
      presentation: {
        typeLabel: "Project",
        typeTone: "#D72228",
        icon: "FolderKanban",
      },
    });
    expect(record.dependencies).toEqual([]);
    expect(record.requiredQuestItems).toEqual([]);
  });

  it("projects the Inventory acquired date for contextual sorting", () => {
    const inventory = document("INV-0073", {
      status: "unlocked",
      acquired: "2026-07-20",
    });

    expect(documentToMissionView(inventory, []).presentation?.acquiredDate)
      .toBe("2026-07-20");
  });

  it("defines the typed detail property matrix without type-specific renderers", () => {
    expect(DOCUMENT_DETAIL_PROPERTY_MATRIX).toEqual({
      mission: ["status", "category", "assignee", "project", "start", "due"],
      project: ["status", "category", "owner", "start", "due", "mission_count", "color"],
      inventory: ["status", "category", "assignee", "acquired", "color"],
    });
    expect(DEFAULT_MISSION_DETAIL_CORE_PROPERTIES).toEqual([
      "status",
      "category",
      "responsible",
      "project",
      "start",
      "due",
    ]);
  });

  it("projects Project detail fields without self-reference or foreign system properties", () => {
    const project = {
      ...document("project-tloz", {
        status: "active",
        category: "normal",
        owner: "user-1",
        assignee: "compat-user",
        start: "2026-07-04",
        due: "2026-08-01",
        progress: 55,
        blocked_reason: "hidden",
        acquired: "2026-07-01",
        mission_count: 12,
        custom_priority: "high",
      }),
      kind: "project" as const,
    };
    const originalProperties = structuredClone(project.properties);
    const projection = resolveDocumentDetailPropertyProjection(
      project,
      detailDefinition("project"),
    );

    expect(projection.core).toEqual([
      "status",
      "category",
      "responsible",
      "start",
      "due",
    ]);
    expect(projection.fields.map((field) => field.key)).toEqual([
      "mission_count",
      "custom_priority",
      "color",
    ]);
    expect(projection.core).not.toContain("project");
    expect(project.properties).toEqual(originalProperties);
  });

  it("projects Inventory detail fields without project scheduling or Mission operations", () => {
    const inventory = document("INV-0001", {
      status: "unlocked",
      category: "tool",
      assignee: "user-1",
      owner: "compat-owner",
      start: "2026-07-04",
      due: "2026-08-01",
      progress: 55,
      blocked_reason: "hidden",
      acquired: "2026-07-01",
      mission_count: 4,
      serial: "ZV-73",
    });
    const projection = resolveDocumentDetailPropertyProjection(
      inventory,
      detailDefinition("inventory"),
    );

    expect(projection.core).toEqual(["status", "category", "responsible"]);
    expect(projection.fields.map((field) => field.key)).toEqual([
      "acquired",
      "serial",
      "color",
    ]);
    expect(projection.core).not.toContain("project");
  });

  it("keeps an unassigned responsible field available for future assignment", () => {
    const inventory = document("INV-0003", {
      status: "locked",
      category: "other",
      assignee: null,
    });

    expect(resolveDocumentDetailPropertyProjection(
      inventory,
      detailDefinition("inventory"),
    ).core).toContain("responsible");
  });

  it("uses configured entity colors and inherited Mission type colors", () => {
    const project = {
      ...document("project-tloz", { color: "#d72228" }),
      kind: "project" as const,
    };
    const mission = {
      ...document("TLO-0001", {}),
      kind: "mission" as const,
    };

    expect(resolveDocumentDetailColor(project, "#2D6CDF")).toBe("#D72228");
    expect(resolveDocumentDetailColor(mission, "#7a4ed9")).toBe("#7A4ED9");
    expect(resolveDocumentDetailColor(mission, "invalid", "#1E8E5A")).toBe("#1E8E5A");
  });

  it("treats null, empty text and empty selections as absent without hiding zero or false", () => {
    expect(isDocumentDetailValuePresent(null)).toBe(false);
    expect(isDocumentDetailValuePresent("")).toBe(false);
    expect(isDocumentDetailValuePresent([])).toBe(false);
    expect(isDocumentDetailValuePresent(0)).toBe(true);
    expect(isDocumentDetailValuePresent(false)).toBe(true);
  });

  it("resolves Mission documents across canonical and legacy identifiers", () => {
    const legacyMission = {
      ...document("FID-0001", {}),
      id: "legacy-mission-1",
      kind: "mission" as const,
    };
    const canonicalDocument = {
      ...document("FID-0001", {}),
      id: "document-1",
      kind: "mission" as const,
      source: { type: "mission" as const, id: legacyMission.id },
    };
    const record = documentToMissionView(legacyMission, []);

    expect(resolveDocumentRecordSelection(
      [{ ...canonicalDocument, id: legacyMission.id, source: undefined }],
      record,
      true,
    )).toMatchObject({ kind: "document", document: { id: legacyMission.id } });
    expect(resolveDocumentRecordSelection([canonicalDocument], record, true)).toEqual({
      kind: "document",
      document: canonicalDocument,
    });
    expect(resolveDocumentRecordSelection(
      [{ ...canonicalDocument, source: undefined }],
      record,
      true,
    )).toMatchObject({ kind: "document", document: { publicId: "FID-0001" } });
  });

  it("falls back to a legacy Mission only when the collection allows it", () => {
    const record = documentToMissionView({
      ...document("FID-0002", {}),
      id: "legacy-mission-2",
      kind: "mission",
    }, []);

    expect(resolveDocumentRecordSelection([], record, true)).toEqual({
      kind: "legacy-mission",
      mission: record,
    });
    expect(resolveDocumentRecordSelection([], record, false)).toEqual({
      kind: "unavailable",
    });
  });
});

function document(
  publicId: string,
  properties: TlozDocument["properties"],
): TlozDocument {
  return {
    id: publicId,
    publicId,
    kind: "inventory",
    title: `Item ${publicId}`,
    summary: "",
    body: "",
    revision: 1,
    properties,
    createdAt: "2026-07-27T00:00:00.000Z",
    updatedAt: "2026-07-27T00:00:00.000Z",
  };
}

function detailDefinition(
  kind: TlozDocumentDefinition["kind"],
): TlozDocumentDefinition {
  const detailFields = [
    "publicId",
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
    kind === "project" ? "custom_priority" : "serial",
  ];
  const fields: TlozDocumentPresentationField[] = detailFields.map((key, position) => ({
    key,
    label: key,
    format: key === "acquired" || key === "start" || key === "due"
      ? "date"
      : key === "mission_count" || key === "progress"
        ? "number"
        : key === "status"
          ? "status"
          : "text",
    position,
    visible: true,
    ...(key === "status"
      ? {
          options: [{
            value: kind === "inventory" ? "unlocked" : "active",
            label: kind === "inventory" ? "Desbloqueado" : "Activo",
            color: "#1E6B3C",
            role: "done" as const,
          }],
        }
      : {}),
  }));
  return {
    id: `definition-${kind}`,
    key: kind,
    kind,
    scope: "collection",
    fields,
    views: [{ id: "detail", fields: detailFields }],
    defaultView: "detail",
  };
}
