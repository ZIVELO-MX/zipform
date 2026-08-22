import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ authenticateRequest: vi.fn(), getMissionDetail: vi.fn(), list: vi.fn() }));
vi.mock("../../../../../../lib/api-auth", () => ({ authenticateRequest: mocks.authenticateRequest }));
vi.mock("@tloz/data", () => ({ dataClient: { tloz: { getMissionDetail: mocks.getMissionDetail }, activity: { list: mocks.list } } }));

import { GET } from "./route";

describe("GET /api/v1/missions/:missionId/activity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({ user: { id: "agent-1" }, source: "api_key" });
    mocks.getMissionDetail.mockResolvedValue({ id: "mission-1", displayId: "TLO-0001" });
    mocks.list.mockResolvedValue({ data: [{ id: "event-1", action: "mission.updated" }], nextCursor: null });
  });

  it("resolves display IDs and returns the immutable event page", async () => {
    const response = await GET(new NextRequest("https://tloz.test/api/v1/missions/TLO-0001/activity?limit=8"), { params: Promise.resolve({ missionId: "TLO-0001" }) });
    expect(response.status).toBe(200);
    expect(mocks.list).toHaveBeenCalledWith("mission-1", { limit: 8, cursor: undefined });
    expect(await response.json()).toEqual({ data: [{ id: "event-1", action: "mission.updated" }], nextCursor: null });
  });

  it("rejects invalid pagination before reading events", async () => {
    const response = await GET(new NextRequest("https://tloz.test/api/v1/missions/TLO-0001/activity?limit=101"), { params: Promise.resolve({ missionId: "TLO-0001" }) });
    expect(response.status).toBe(400);
    expect(mocks.list).not.toHaveBeenCalled();
  });
});
