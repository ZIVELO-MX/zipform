import type {
  TlozDocument,
  TlozDocumentPresentationField,
} from "@tloz/types";
import { describe, expect, it } from "vitest";
import {
  documentToMissionView,
  documentValue,
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
