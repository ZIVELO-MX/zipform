import { beforeEach, describe, expect, it, vi } from "vitest";
import { dataClient } from "@zipform/data";
import { authenticateRequest } from "../../../../../lib/api-auth";
import { DELETE, GET, PATCH } from "./route";

vi.mock("@zipform/data", () => ({
  dataClient: { tloz: { getMissionDetail: vi.fn(), updateMission: vi.fn(), deleteMission: vi.fn() } },
}));
vi.mock("../../../../../lib/api-auth", () => ({ authenticateRequest: vi.fn() }));

describe("PATCH /api/v1/missions/:missionId", () => {
  beforeEach(() => {
    vi.mocked(authenticateRequest).mockResolvedValue({ user: { id: "agent-1", type: "agent", role: "agent:operative" } } as never);
    vi.mocked(dataClient.tloz.updateMission).mockReset();
    vi.mocked(dataClient.tloz.getMissionDetail)
      .mockReset()
      .mockResolvedValueOnce({ id: "mission-1", ownerId: "owner-1" } as never)
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

  it("returns 403 without updating another developer's Mission", async () => {
    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: "developer-1", type: "human", role: "Full Stack Developer" },
    } as never);
    vi.mocked(dataClient.tloz.getMissionDetail).mockReset().mockResolvedValue({
      id: "mission-1",
      ownerId: "owner-1",
    } as never);

    const response = await PATCH(new Request("https://zipform.test/api/v1/missions/mission-1", {
      method: "PATCH",
      body: JSON.stringify({ title: "Denied" }),
    }), { params: Promise.resolve({ missionId: "mission-1" }) });

    expect(response.status).toBe(403);
    expect(dataClient.tloz.updateMission).not.toHaveBeenCalled();
  });

  it("does not expose unexpected update errors", async () => {
    vi.mocked(dataClient.tloz.getMissionDetail).mockReset().mockResolvedValue({
      id: "mission-1",
      ownerId: "owner-1",
    } as never);
    vi.mocked(dataClient.tloz.updateMission).mockRejectedValue(new Error("postgres://secret@database"));
    const response = await PATCH(new Request("https://zipform.test/api/v1/missions/mission-1", {
      method: "PATCH",
      body: JSON.stringify({ title: "Updated" }),
    }), { params: Promise.resolve({ missionId: "mission-1" }) });
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body).toMatchObject({ error: { code: "INTERNAL_ERROR", message: "Error interno del servidor." } });
    expect(JSON.stringify(body)).not.toContain("postgres://");
  });

  it("reserves Mission deletion for Platform Owners", async () => {
    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: "operative-1", type: "agent", role: "agent:operative" },
    } as never);
    const denied = await DELETE(new Request("https://zipform.test/api/v1/missions/mission-1", { method: "DELETE" }), {
      params: Promise.resolve({ missionId: "mission-1" }),
    });
    expect(denied.status).toBe(403);
    expect(dataClient.tloz.deleteMission).not.toHaveBeenCalled();

    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: "owner-1", type: "human", role: "Platform Owner" },
    } as never);
    vi.mocked(dataClient.tloz.getMissionDetail).mockReset().mockResolvedValue({ id: "mission-1", ownerId: "developer-1" } as never);
    const allowed = await DELETE(new Request("https://zipform.test/api/v1/missions/mission-1", { method: "DELETE" }), {
      params: Promise.resolve({ missionId: "mission-1" }),
    });
    expect(allowed.status).toBe(200);
    expect(dataClient.tloz.deleteMission).toHaveBeenCalledWith("mission-1");
  });

  it("sanitizes the nested owner profile for reader agents", async () => {
    vi.mocked(authenticateRequest).mockResolvedValue({
      user: { id: "reader-1", type: "agent", role: "agent:reader" },
    } as never);
    vi.mocked(dataClient.tloz.getMissionDetail).mockReset().mockResolvedValue({
      id: "mission-1",
      ownerId: "developer-1",
      owner: {
        id: "developer-1",
        name: "Developer",
        username: "developer",
        email: "developer@zipform.dev",
        role: "Full Stack Developer",
        type: "human",
        avatarUrl: "",
        theme: "system",
      },
    } as never);
    const response = await GET(new Request("https://zipform.test/api/v1/missions/mission-1"), {
      params: Promise.resolve({ missionId: "mission-1" }),
    });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.owner).not.toHaveProperty("email");
  });
});
