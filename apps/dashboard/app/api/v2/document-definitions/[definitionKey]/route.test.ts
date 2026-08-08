import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  getDefinition: vi.fn(),
}));

vi.mock("@tloz/data", async (importOriginal) => ({
  ...await importOriginal<typeof import("@tloz/data")>(),
  dataClient: {
    canonicalDocuments: { getDefinition: mocks.getDefinition },
  },
}));
vi.mock("../../../../../lib/api-auth", () => ({
  authenticateRequest: mocks.authenticateRequest,
}));

import { GET } from "./route";

describe("GET /api/v2/document-definitions/:definitionKey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({
      user: { id: "user-1", type: "human", role: "admin" },
    });
  });

  it("returns a persisted document definition", async () => {
    mocks.getDefinition.mockResolvedValue({
      id: "definition-projects",
      key: "projects",
      kind: "project",
      scope: "collection",
      fields: [],
      views: [{ id: "detail", fields: ["title"] }],
      defaultView: "detail",
    });

    const response = await GET(
      new Request("https://tloz.test/api/v2/document-definitions/projects"),
      { params: Promise.resolve({ definitionKey: "projects" }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.getDefinition).toHaveBeenCalledWith("projects");
    await expect(response.json()).resolves.toMatchObject({
      data: { key: "projects" },
    });
  });

  it("returns the typed not-found error for unknown definitions", async () => {
    mocks.getDefinition.mockResolvedValue(null);

    const response = await GET(
      new Request("https://tloz.test/api/v2/document-definitions/missing"),
      { params: Promise.resolve({ definitionKey: "missing" }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "DOCUMENT_NOT_FOUND" },
    });
  });
});
