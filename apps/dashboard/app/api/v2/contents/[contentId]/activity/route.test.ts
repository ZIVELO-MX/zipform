import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  getContent: vi.fn(),
  list: vi.fn(),
}));

vi.mock("@tloz/data", async (importOriginal) => ({
  ...await importOriginal<typeof import("@tloz/data")>(),
  dataClient: {
    containerContent: { getContent: mocks.getContent },
    activity: { list: mocks.list },
  },
}));
vi.mock("../../../../../../lib/api-auth", () => ({ authenticateRequest: mocks.authenticateRequest }));

import { GET } from "./route";

const content = {
  id: "content-1", publicId: "workshop-idea-1", containerId: "workshop-1", presentation: "workshop",
  title: "Idea", summary: "", body: "", data: {}, revision: 1,
  createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
};

const context = { params: Promise.resolve({ contentId: "content-1" }) };

describe("/api/v2/contents/{contentId}/activity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({ user: { id: "agent-1", type: "agent", role: "agent:operative" } });
    mocks.getContent.mockResolvedValue(content);
    mocks.list.mockResolvedValue({ data: [], nextCursor: null });
  });

  it("returns the activity feed with a cursor envelope", async () => {
    const response = await GET(new NextRequest("https://tloz.test/api/v2/contents/content-1/activity?limit=10"), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: [], nextCursor: null });
    expect(mocks.list).toHaveBeenCalledWith("content-1", { limit: 10, cursor: undefined });
  });

  it("returns an error envelope instead of an unhandled failure", async () => {
    mocks.list.mockRejectedValue(new Error("activity store unreachable"));

    const response = await GET(new NextRequest("https://tloz.test/api/v2/contents/content-1/activity"), context);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "INTERNAL_ERROR" } });
  });

  it("validates the limit before touching the store", async () => {
    const response = await GET(new NextRequest("https://tloz.test/api/v2/contents/content-1/activity?limit=0"), context);

    expect(response.status).toBe(400);
    expect(mocks.list).not.toHaveBeenCalled();
  });
});
