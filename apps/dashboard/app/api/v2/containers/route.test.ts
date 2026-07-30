import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  listContainers: vi.fn(),
  createContainer: vi.fn(),
}));

vi.mock("@tloz/data", async (importOriginal) => ({
  ...await importOriginal<typeof import("@tloz/data")>(),
  dataClient: { containerContent: mocks },
}));
vi.mock("../../../../lib/api-auth", () => ({ authenticateRequest: mocks.authenticateRequest }));

import { GET, POST } from "./route";

const container = {
  id: "container-1", publicId: "project-core", presentation: "project", title: "Core", summary: "", body: "",
  definition: { fields: [], views: [{ id: "default", fields: [] }], defaultView: "default" }, data: { ownerId: "agent-1" },
  revision: 1, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("/api/v2/containers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({ user: { id: "agent-1", type: "agent", role: "agent:operative" } });
    mocks.listContainers.mockResolvedValue([container]);
    mocks.createContainer.mockResolvedValue(container);
  });

  it("lists canonical containers with a cursor envelope", async () => {
    const response = await GET(new NextRequest("https://tloz.test/api/v2/containers?limit=25"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ data: [container], nextCursor: null });
  });

  it("creates a container without calling a legacy repository", async () => {
    const response = await POST(new NextRequest("https://tloz.test/api/v2/containers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId: "project-core", presentation: "project", title: "Core", data: { ownerId: "agent-1" } }),
    }));
    expect(response.status).toBe(201);
    expect(mocks.createContainer).toHaveBeenCalledWith(expect.objectContaining({ presentation: "project", title: "Core" }));
  });
});
