import { beforeEach, describe, expect, it, vi } from "vitest";
import { dataClient } from "@zipform/data";
import { authenticateRequest } from "../../../../../../../lib/api-auth";
import { DELETE } from "./route";

vi.mock("@zipform/data", () => ({
  dataClient: { tloz: { getMissionDetail: vi.fn(), removeMissionResource: vi.fn() } },
}));
vi.mock("../../../../../../../lib/api-auth", () => ({ authenticateRequest: vi.fn() }));

describe("DELETE /api/v1/missions/:missionId/resources/:resourceId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: "operative-1", type: "agent", role: "agent:operative" },
    } as never);
    vi.mocked(dataClient.tloz.getMissionDetail).mockResolvedValue({
      id: "mission-1",
      ownerId: "owner-1",
      resources: [{ id: "resource-1" }],
    } as never);
  });

  it("returns 404 without removing a Resource from the wrong parent", async () => {
    const response = await DELETE(new Request("https://zipform.test/api/v1/missions/mission-1/resources/resource-2", {
      method: "DELETE",
    }), { params: Promise.resolve({ missionId: "mission-1", resourceId: "resource-2" }) });

    expect(response.status).toBe(404);
    expect(dataClient.tloz.removeMissionResource).not.toHaveBeenCalled();
  });

  it("removes a Resource only after matching its parent", async () => {
    vi.mocked(dataClient.tloz.removeMissionResource).mockResolvedValue({ id: "mission-1" } as never);
    const response = await DELETE(new Request("https://zipform.test/api/v1/missions/mission-1/resources/resource-1", {
      method: "DELETE",
    }), { params: Promise.resolve({ missionId: "mission-1", resourceId: "resource-1" }) });

    expect(response.status).toBe(200);
    expect(dataClient.tloz.removeMissionResource).toHaveBeenCalledWith("mission-1", "resource-1");
  });
});
