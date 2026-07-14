import { beforeEach, describe, expect, it, vi } from "vitest";
import { dataClient } from "@zipform/data";
import { authenticateRequest } from "../../../../../lib/api-auth";
import { PATCH } from "./route";

vi.mock("@zipform/data", () => ({
  dataClient: { tloz: { getMissionDetail: vi.fn(), updateMission: vi.fn() } },
}));
vi.mock("../../../../../lib/api-auth", () => ({ authenticateRequest: vi.fn() }));

describe("PATCH /api/v1/missions/:missionId", () => {
  beforeEach(() => {
    vi.mocked(authenticateRequest).mockResolvedValue({ user: { id: "agent-1" } } as never);
    vi.mocked(dataClient.tloz.updateMission).mockReset();
    vi.mocked(dataClient.tloz.getMissionDetail)
      .mockReset()
      .mockResolvedValueOnce({ id: "mission-1" } as never)
      .mockResolvedValueOnce({
        id: "mission-1",
        description: "Updated",
        descriptionDetail: "- [x] Added\n- [ ] Pending",
        progress: 50,
        checklistCount: 2,
        completed: 1,
        checklist: [],
        resources: [],
      } as never);
  });

  it("returns MissionDetail after an atomic mixed document update", async () => {
    const payload = {
      description: "Updated",
      descriptionDetail: "- [x] Added\n- [ ] Pending",
      progress: 100,
    };
    const response = await PATCH(new Request("https://zipform.test/api/v1/missions/mission-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }), { params: Promise.resolve({ missionId: "mission-1" }) });

    expect(response.status).toBe(200);
    expect(dataClient.tloz.updateMission).toHaveBeenCalledWith("mission-1", payload);
    expect(await response.json()).toMatchObject({
      data: { descriptionDetail: payload.descriptionDetail, progress: 50, checklistCount: 2, completed: 1 },
    });
  });
});
