import { describe, expect, it } from "vitest";
import type { ContainerRecord, ContentRecord } from "@tloz/types";
import {
  apiErrorMessage,
  canonicalCollectionViews,
  canonicalControlKind,
  createContentPayload,
  filterAndSortContents,
} from "./container-content-view-model";

const definition = {
  fields: [
    {
      key: "status",
      label: "Estado",
      format: "status",
      options: [
        { value: "active", label: "Activo", role: "active" as const },
        { value: "archived", label: "Archivado", role: "done" as const },
      ],
    },
    { key: "ownerId", label: "Responsable", format: "person" },
    { key: "dueDate", label: "Vence", format: "date" },
  ],
  views: [
    { id: "list", fields: ["title", "status"] },
    { id: "table", fields: ["title", "status", "ownerId", "dueDate"] },
    { id: "detail", fields: ["publicId", "status", "ownerId", "dueDate"] },
  ],
  defaultView: "table",
};

const container: ContainerRecord = {
  id: "system-workshop",
  publicId: "workshop",
  slug: "workshop",
  presentation: "workshop",
  title: "Workshop",
  summary: "",
  body: "",
  definition,
  data: {},
  revision: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const contents: ContentRecord[] = [
  {
    id: "later",
    publicId: "workshop-later",
    containerId: container.id,
    presentation: "workshop",
    title: "Zulu",
    summary: "",
    body: "",
    data: { status: "active", ownerId: "user-2", dueDate: "2026-08-02" },
    revision: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "archived",
    publicId: "workshop-archived",
    containerId: container.id,
    presentation: "workshop",
    title: "Alpha",
    summary: "",
    body: "",
    data: { status: "archived", ownerId: "user-1", dueDate: "2026-08-01" },
    revision: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const state = {
  view: "table" as const,
  projectId: "all",
  ownerId: "all",
  sort: "default" as const,
  grouping: "status" as const,
  showCompleted: true,
};

describe("canonical Container/Content view model", () => {
  it("keeps detail as an item view and maps control capabilities by presentation", () => {
    expect(canonicalCollectionViews(definition)).toEqual(["list", "table"]);
    expect(canonicalControlKind("workshop")).toBe("project");
    expect(canonicalControlKind("library")).toBe("inventory");
  });

  it("filters completed and owner values and sorts without mutating the source", () => {
    expect(filterAndSortContents(contents, { ...state, showCompleted: false }, definition).map((item) => item.id))
      .toEqual(["later"]);
    expect(filterAndSortContents(contents, { ...state, ownerId: "user-1" }, definition).map((item) => item.id))
      .toEqual(["archived"]);
    expect(filterAndSortContents(contents, { ...state, sort: "title" }, definition).map((item) => item.title))
      .toEqual(["Alpha", "Zulu"]);
    expect(contents.map((item) => item.title)).toEqual(["Zulu", "Alpha"]);
  });

  it("builds canonical create input and preserves typed API errors", () => {
    expect(createContentPayload(container, "  Idea  ", { status: "active" }, "workshop-1")).toEqual({
      publicId: "workshop-1",
      containerId: "system-workshop",
      presentation: "workshop",
      title: "Idea",
      data: { status: "active" },
    });
    expect(apiErrorMessage({ error: { message: "No autorizado." } }, "Fallback")).toBe("No autorizado.");
    expect(apiErrorMessage(null, "Fallback")).toBe("Fallback");
  });
});
