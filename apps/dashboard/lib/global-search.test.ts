import { describe, expect, it } from "vitest";
import type { TlozDocument } from "@tloz/types";
import {
  decodeSearchCursor,
  documentDestination,
  documentResult,
  encodeSearchCursor,
} from "./global-search";

const document = (overrides: Partial<TlozDocument> = {}): TlozDocument => ({
  id: "doc-1",
  publicId: "TLO-0012",
  kind: "mission",
  projectSlug: "tloz",
  title: "Búsqueda global",
  summary: "",
  body: "",
  revision: 1,
  properties: {},
  createdAt: "2026-08-13T00:00:00.000Z",
  updatedAt: "2026-08-13T00:00:00.000Z",
  ...overrides,
});

describe("global search navigation", () => {
  it("maps canonical documents to their stable destination and context", () => {
    expect(documentResult(document())).toMatchObject({
      type: "mission",
      context: "Mission · tloz",
      destination: "/tloz/TLO-0012",
    });
    expect(documentDestination(document({ kind: "inventory", projectSlug: "library", publicId: "book-1" }))).toBe("/library/book-1");
    expect(documentDestination(document({ kind: "project", publicId: "project-tloz" }))).toBe("/projects/project-tloz");
  });

  it("round-trips a composite cursor without exposing internal shape in the URL", () => {
    const cursor = encodeSearchCursor({ documents: "doc-2", resources: "resource-3" });
    expect(cursor).not.toContain("doc-2");
    expect(decodeSearchCursor(cursor)).toEqual({ documents: "doc-2", resources: "resource-3" });
  });

  it("rejects malformed cursors instead of restarting at the first page", () => {
    expect(() => decodeSearchCursor("not-a-cursor")).toThrow("INVALID_SEARCH_CURSOR");
  });
});
