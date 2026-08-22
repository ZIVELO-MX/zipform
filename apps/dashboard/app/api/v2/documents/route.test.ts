import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaginationCursorError } from "@tloz/data";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  documents: {
    find: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    replaceProjectContract: vi.fn(),
  },
  tloz: {
    createProject: vi.fn(),
    createMission: vi.fn(),
    createQuestItem: vi.fn(),
  },
}));

vi.mock("@tloz/data", async (importOriginal) => ({
  ...await importOriginal<typeof import("@tloz/data")>(),
  dataClient: {
    canonicalDocuments: mocks.documents,
    tloz: mocks.tloz,
  },
}));
vi.mock("../../../../lib/api-auth", () => ({
  authenticateRequest: mocks.authenticateRequest,
}));

import { GET, POST } from "./route";

const statusField = {
  id: "status",
  key: "status",
  label: "Estado",
  type: "select" as const,
  required: true,
  visible: true,
  position: 0,
  defaultValue: "work",
  options: [
    { value: "queue", label: "Queue", role: "backlog" as const },
    { value: "work", label: "Work", role: "active" as const },
    { value: "shipped", label: "Shipped", role: "done" as const },
  ],
};
const categoryField = {
  id: "category",
  key: "category",
  label: "Categoría",
  type: "select" as const,
  required: true,
  visible: true,
  position: 1,
  defaultValue: "engineering",
  options: [{ value: "engineering", label: "Engineering" }],
};
const priorityField = {
  id: "priority",
  key: "priority",
  label: "Prioridad",
  type: "select" as const,
  required: false,
  visible: true,
  position: 2,
  options: [{ value: "high", label: "Alta" }],
};

describe("POST /api/v2/documents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({
      user: { id: "agent-1", type: "agent", role: "agent:operative" },
    });
    mocks.documents.find.mockResolvedValue({ data: [], nextCursor: null });
  });

  it("returns 400 for an invalid document cursor", async () => {
    mocks.documents.find.mockRejectedValue(new PaginationCursorError("missing"));

    const response = await GET(new NextRequest("https://tloz.test/api/v2/documents?cursor=missing"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "INVALID_REQUEST", fields: { cursor: "invalid" } },
    });
  });

  it("creates a Mission with Project defaults and custom contract values", async () => {
    const project = {
      id: "project-document-1",
      publicId: "project-core",
      kind: "project",
      source: { type: "project", id: "project-1" },
      contract: { projectId: "project-core", fields: [statusField, categoryField, priorityField] },
    };
    const createdDocument = {
      id: "mission-document-1",
      publicId: "COR-0001",
      kind: "mission",
      title: "Build documents",
      summary: "",
      body: "",
      revision: 1,
      properties: { status: "work", category: "engineering" },
      createdAt: "2026-07-27T00:00:00.000Z",
      updatedAt: "2026-07-27T00:00:00.000Z",
    };
    mocks.documents.get.mockImplementation(async (reference: string) => (
      reference === "project-core" ? project : createdDocument
    ));
    mocks.tloz.createMission.mockResolvedValue({ id: "mission-1", displayId: "COR-0001" });
    mocks.documents.update.mockResolvedValue({
      ...createdDocument,
      revision: 2,
      properties: { ...createdDocument.properties, priority: "high" },
    });

    const response = await POST(new NextRequest("https://tloz.test/api/v2/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "mission",
        parentPublicId: "project-core",
        title: "Build documents",
        properties: { priority: "high" },
      }),
    }));

    expect(response.status).toBe(201);
    expect(mocks.tloz.createMission).toHaveBeenCalledWith(expect.objectContaining({
      projectId: "project-1",
      status: "work",
      type: "engineering",
    }));
    expect(mocks.documents.update).toHaveBeenCalledWith(
      "mission-document-1",
      { properties: { priority: "high" } },
      1,
    );
  });

  it("validates a Project contract before creating its legacy projection", async () => {
    const response = await POST(new NextRequest("https://tloz.test/api/v2/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "project",
        title: "Invalid contract",
        contract: {
          fields: [{
            ...statusField,
            options: [{ value: "work", label: "Work" }],
          }, categoryField],
        },
      }),
    }));

    expect(response.status).toBe(400);
    expect(mocks.tloz.createProject).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "DOCUMENT_INVALID",
        fields: { "contract.fields.status": "invalid" },
      },
    });
  });
});
