import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  authorizeApiOperation: vi.fn(),
  getContainer: vi.fn(),
  updateContainer: vi.fn(),
}));

vi.mock("@tloz/data", async (importOriginal) => ({
  ...await importOriginal<typeof import("@tloz/data")>(),
  dataClient: { containerContent: { getContainer: mocks.getContainer, updateContainer: mocks.updateContainer } },
}));
vi.mock("../../../../../lib/api-auth", () => ({ authenticateRequest: mocks.authenticateRequest }));
vi.mock("../../../../../lib/authorization", () => ({ authorizeApiOperation: mocks.authorizeApiOperation }));

import { PATCH } from "./route";

const container = {
  id: "container-1", publicId: "project-core", presentation: "project", title: "Core", summary: "", body: "",
  definition: { fields: [], views: [{ id: "default", fields: [] }], defaultView: "default" }, data: { ownerId: "agent-1" },
  revision: 1, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
};

const context = { params: Promise.resolve({ containerId: "project-core" }) };

function patch(body: unknown) {
  return new NextRequest("https://tloz.test/api/v2/containers/project-core", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "If-Match": '"1"' },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/v2/containers/:containerId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({ user: { id: "agent-1", type: "agent", role: "agent:operative" } });
    mocks.authorizeApiOperation.mockReturnValue(null);
    mocks.getContainer.mockResolvedValue(container);
    mocks.updateContainer.mockResolvedValue(container);
  });

  it.each([
    ["a number", 42],
    ["an empty object", {}],
    ["a definition without views", { fields: [], defaultView: "default" }],
    ["a field without a key", { fields: [{ label: "Nombre" }], views: [{ id: "default", fields: [] }], defaultView: "default" }],
  ])("rejects %s as definition with 400 and never writes it", async (_label, definition) => {
    const response = await PATCH(patch({ definition }), context);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "STORE_INVALID" } });
    expect(mocks.updateContainer).not.toHaveBeenCalled();
  });

  it("writes a well-formed definition", async () => {
    const definition = { fields: [{ key: "title", label: "Título", format: "text" }], views: [{ id: "default", fields: ["title"] }], defaultView: "default" };
    const response = await PATCH(patch({ definition }), context);
    expect(response.status).toBe(200);
    expect(mocks.updateContainer).toHaveBeenCalledWith("container-1", expect.objectContaining({ definition }), 1);
  });
});
