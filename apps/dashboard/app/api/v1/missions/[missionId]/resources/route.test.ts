import { beforeEach, describe, expect, it, vi } from "vitest";
import { dataClient } from "@zipform/data";
import { authenticateRequest } from "../../../../../../lib/api-auth";
import { POST } from "./route";

vi.mock("@zipform/data", () => ({ dataClient: { tloz: { addMissionResource: vi.fn(), getMissionDetail: vi.fn() } } }));
vi.mock("../../../../../../lib/api-auth", () => ({ authenticateRequest: vi.fn() }));

describe("POST /api/v1/missions/:missionId/resources", () => {
  beforeEach(() => {
    vi.mocked(authenticateRequest).mockResolvedValue({ user: { id: "agent-1", type: "agent", role: "agent:operative" } } as never);
    vi.mocked(dataClient.tloz.getMissionDetail).mockResolvedValue({ id: "mission-1", ownerId: "owner-1" } as never);
    vi.mocked(dataClient.tloz.addMissionResource).mockResolvedValue({ id: "mission-1", resources: [{ id: "resource-1", icon: "Github" }] } as never);
  });

  it("persists a manually selected resource icon", async () => {
    const response = await POST(new Request("https://zipform.test/api/v1/missions/mission-1/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "link", title: "Repository", url: "https://github.com/org/repo", icon: "Github" }),
    }), { params: Promise.resolve({ missionId: "mission-1" }) });

    expect(response.status).toBe(200);
    expect(dataClient.tloz.addMissionResource).toHaveBeenCalledWith("mission-1", {
      type: "link",
      title: "Repository",
      url: "https://github.com/org/repo",
      fileId: undefined,
      icon: "Github",
    });
  });
});
