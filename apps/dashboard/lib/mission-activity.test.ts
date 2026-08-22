import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getContent: vi.fn(),
  append: vi.fn(),
}));

vi.mock("@tloz/data", () => ({
  dataClient: {
    containerContent: { getContent: mocks.getContent },
    activity: { append: mocks.append },
  },
}));

import { recordMissionActivity } from "./mission-activity";

describe("recordMissionActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getContent.mockResolvedValue({ id: "content-1" });
    mocks.append.mockImplementation(async (input) => input);
  });

  it("records immutable identity and a scoped retry key", async () => {
    const input = {
      mission: { id: "mission-1", displayId: "TLO-0001" },
      actorId: "agent-1",
      action: "mission.updated",
      source: "api_key" as const,
      idempotencyKey: "retry-1",
    };
    await recordMissionActivity(input);
    await recordMissionActivity(input);

    expect(mocks.append).toHaveBeenCalledTimes(2);
    expect(mocks.append.mock.calls[0]?.[0]).toMatchObject({
      contentId: "content-1",
      entityType: "mission",
      entityId: "mission-1",
      entityPublicId: "TLO-0001",
      actorId: "agent-1",
      source: "api_key",
    });
    expect(mocks.append.mock.calls[0]?.[0].idempotencyKey).toMatch(/^[a-f0-9]{64}$/);
    expect(mocks.append.mock.calls[1]?.[0].idempotencyKey).toBe(mocks.append.mock.calls[0]?.[0].idempotencyKey);
  });
});
