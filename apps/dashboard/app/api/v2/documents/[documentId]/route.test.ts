import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  documents: {
    get: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@tloz/data", async (importOriginal) => ({
  ...await importOriginal<typeof import("@tloz/data")>(),
  dataClient: { canonicalDocuments: mocks.documents },
}));
vi.mock("../../../../../lib/api-auth", () => ({
  authenticateRequest: mocks.authenticateRequest,
}));

import { GET } from "./route";

describe("GET /api/v2/documents/:documentId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({
      user: { id: "user-1", type: "human", role: "admin" },
    });
    mocks.documents.get.mockResolvedValue({
      id: "project-1",
      publicId: "project-tloz",
      kind: "project",
      title: "TLOZ",
      summary: "",
      body: "",
      revision: 1,
      properties: {},
      children: { data: [], nextCursor: null, total: 4 },
      createdAt: "2026-07-27T00:00:00.000Z",
      updatedAt: "2026-07-27T00:00:00.000Z",
    });
  });

  it("loads paginated children only when requested", async () => {
    const response = await GET(
      new Request("https://tloz.test/api/v2/documents/project-tloz?include=children&childLimit=10&childCursor=child-1"),
      { params: Promise.resolve({ documentId: "project-tloz" }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.documents.get).toHaveBeenCalledWith("project-tloz", {
      includeChildren: true,
      childrenPagination: { limit: 10, cursor: "child-1" },
    });
    await expect(response.json()).resolves.toMatchObject({
      data: { children: { total: 4 } },
    });
  });

  it("rejects unsupported aggregate names before reading the document", async () => {
    const response = await GET(
      new Request("https://tloz.test/api/v2/documents/project-tloz?include=missions"),
      { params: Promise.resolve({ documentId: "project-tloz" }) },
    );

    expect(response.status).toBe(400);
    expect(mocks.documents.get).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "INVALID_REQUEST" },
    });
  });
});
