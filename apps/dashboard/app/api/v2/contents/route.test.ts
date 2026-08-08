import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  getContainer: vi.fn(),
  listContainers: vi.fn(),
  createContent: vi.fn(),
}));

vi.mock("@tloz/data", async (importOriginal) => ({ ...await importOriginal<typeof import("@tloz/data")>(), dataClient: { containerContent: mocks } }));
vi.mock("../../../../lib/api-auth", () => ({ authenticateRequest: mocks.authenticateRequest }));

import { POST } from "./route";

const container = { id: "system-workshop", publicId: "workshop", presentation: "workshop", title: "Workshop", summary: "", body: "", definition: { fields: [], views: [], defaultView: "list" }, data: {}, revision: 1, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
const content = { id: "idea-1", publicId: "workshop-idea-1", containerId: container.id, presentation: "workshop", title: "Idea", summary: "", body: "", data: {}, revision: 1, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };

describe("/api/v2/contents presentations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({ user: { id: "agent-1", type: "agent", role: "agent:operative" } });
    mocks.getContainer.mockResolvedValue(container);
    mocks.createContent.mockResolvedValue(content);
  });

  it("creates Workshop content through the shared endpoint", async () => {
    const response = await POST(new NextRequest("https://tloz.test/api/v2/contents", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId: "workshop-idea-1", containerId: container.id, presentation: "workshop", title: "Idea", data: {} }),
    }));
    expect(response.status).toBe(201);
    expect(mocks.createContent).toHaveBeenCalledWith(expect.objectContaining({ containerId: container.id, presentation: "workshop" }));
  });
});
