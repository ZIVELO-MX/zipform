import { beforeEach, describe, expect, it, vi } from "vitest";
import { dataClient } from "@tloz/data";
import { authenticateRequest } from "../../../../../lib/api-auth";
import { POST } from "./route";

vi.mock("@tloz/data", () => ({ dataClient: { tloz: { getMissionDetails: vi.fn() } } }));
vi.mock("../../../../../lib/api-auth", () => ({ authenticateRequest: vi.fn() }));

describe("POST /api/v1/missions/batch", () => {
  beforeEach(() => {
    vi.mocked(authenticateRequest).mockResolvedValue({ user: { id: "agent-1", type: "agent", role: "agent:operative" } } as never);
    vi.mocked(dataClient.tloz.getMissionDetails).mockReset();
  });

  it("preserves request order and reports missing missions per item", async () => {
    vi.mocked(dataClient.tloz.getMissionDetails).mockResolvedValue([
      { id: "mission-b", title: "B" } as never,
      null,
      { id: "mission-a", title: "A" } as never,
    ]);
    const response = await POST(new Request("https://tloz.test/api/v1/missions/batch", {
      method: "POST",
      body: JSON.stringify({ ids: ["mission-b", "missing", "mission-a"] }),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: [
      { id: "mission-b", data: expect.objectContaining({ title: "B" }) },
      { id: "missing", error: { code: "NOT_FOUND", message: "Misión no encontrada." } },
      { id: "mission-a", data: expect.objectContaining({ title: "A" }) },
    ] });
    expect(dataClient.tloz.getMissionDetails).toHaveBeenCalledTimes(1);
  });

  it.each([
    { ids: [] },
    { ids: Array.from({ length: 9 }, (_, index) => `mission-${index}`) },
    { ids: ["mission-1", "MISSION-1"] },
    { ids: [42] },
  ])("rejects invalid and duplicate identifiers", async (body) => {
    const response = await POST(new Request("https://tloz.test/api/v1/missions/batch", { method: "POST", body: JSON.stringify(body) }));
    expect(response.status).toBe(400);
    expect(dataClient.tloz.getMissionDetails).not.toHaveBeenCalled();
  });

  it("does not expose unexpected errors", async () => {
    vi.mocked(dataClient.tloz.getMissionDetails).mockRejectedValue(new Error("postgres://secret"));
    const response = await POST(new Request("https://tloz.test/api/v1/missions/batch", {
      method: "POST",
      body: JSON.stringify({ ids: ["mission-1"] }),
    }));
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("postgres://");
  });
});
