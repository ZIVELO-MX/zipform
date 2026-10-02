import { describe, expect, it } from "vitest";
import type { TlozDocument } from "@tloz/types";
import {
  documentOperation,
  documentResponse,
  handleDocumentError,
  parseExpectedRevision,
  readDocumentBody,
} from "./document-api";
import { TlozDocumentError } from "@tloz/data";

const document: TlozDocument = {
  id: "f76c9d0d-b5f0-4f53-8e21-baa5f7422fe8",
  publicId: "TLO-0023",
  kind: "mission",
  parentPublicId: "project-tloz",
  title: "Documento",
  summary: "",
  body: "## Alcance",
  revision: 4,
  properties: { status: "now" },
  createdAt: "2026-07-27T00:00:00.000Z",
  updatedAt: "2026-07-27T00:00:00.000Z",
};

describe("document API responses", () => {
  it("negotiates Markdown and emits the current revision ETag", async () => {
    const response = documentResponse(
      new Request("https://tloz.test/api/v2/documents/TLO-0023", {
        headers: { Accept: "text/markdown" },
      }),
      document,
    );

    expect(response.headers.get("content-type")).toContain("text/markdown");
    expect(response.headers.get("etag")).toBe('"4"');
    expect(await response.text()).toContain("# Documento");
  });

  it("requires a valid If-Match revision", async () => {
    const missing = parseExpectedRevision(new Request("https://tloz.test/api/v2/documents/TLO-0023"));
    const valid = parseExpectedRevision(new Request("https://tloz.test/api/v2/documents/TLO-0023", {
      headers: { "If-Match": '"4"' },
    }));

    expect(missing).toBeInstanceOf(Response);
    expect((missing as Response).status).toBe(428);
    expect(valid).toBe(4);
  });

  it("maps typed conflicts without leaking internal errors", async () => {
    const response = handleDocumentError(
      new TlozDocumentError("DOCUMENT_REVISION_CONFLICT", "Revisión obsoleta."),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "DOCUMENT_REVISION_CONFLICT", message: "Revisión obsoleta." },
    });
  });
});

describe("document request bodies", () => {
  it("rejects malformed JSON with a typed client error", async () => {
    const request = new Request("https://tloz.test/api/v2/documents", { method: "POST", body: "{oops" });

    await expect(readDocumentBody(request)).rejects.toMatchObject({ code: "DOCUMENT_INVALID" });
  });

  it("rejects JSON payloads that are not objects", async () => {
    await expect(readDocumentBody(new Request("https://tloz.test", { method: "POST", body: "[]" })))
      .rejects.toMatchObject({ code: "DOCUMENT_INVALID" });
    await expect(readDocumentBody(new Request("https://tloz.test", { method: "POST", body: "null" })))
      .rejects.toMatchObject({ code: "DOCUMENT_INVALID" });
  });

  it("returns a plain object for a valid body", async () => {
    const request = new Request("https://tloz.test", { method: "POST", body: '{"title":"Cuerpo"}' });

    await expect(readDocumentBody(request)).resolves.toEqual({ title: "Cuerpo" });
  });
});

describe("document ownership transitions", () => {
  const project = { ...document, kind: "project" } as const;

  it("requires the move operation when an owner changes", () => {
    expect(documentOperation(project, { properties: { owner: "user-2" } })).toBe("move");
    expect(documentOperation(project, { properties: { status: "done" } })).toBe("update");
    expect(documentOperation(project, {})).toBe("update");
  });

  it("requires the move operation when an assignee changes on non-project documents", () => {
    expect(documentOperation(document, { properties: { assignee: "user-2" } })).toBe("move");
    expect(documentOperation(document, { properties: { owner: "user-2" } })).toBe("update");
  });
});
