import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  authorizeQuestItemOperation: vi.fn(),
  updateQuestItem: vi.fn(),
  getQuestItem: vi.fn(),
}));

vi.mock("@tloz/data", () => ({ dataClient: { tloz: { updateQuestItem: mocks.updateQuestItem, getQuestItem: mocks.getQuestItem } } }));
vi.mock("../../../../../lib/api-auth", () => ({ authenticateRequest: mocks.authenticateRequest }));
vi.mock("../../../../../lib/tloz-api-authorization", () => ({ authorizeQuestItemOperation: mocks.authorizeQuestItemOperation }));

import { PATCH } from "./route";

const agent = {
  id: "agent-1",
  name: "Zibot",
  username: "zibot",
  email: "zibot@tloz.dev",
  role: "agent:operative",
  type: "agent",
  avatarUrl: "",
  theme: "system",
};

function patch(body: string) {
  return new NextRequest("http://localhost/api/v1/quest-items/quest-1", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body,
  });
}

const context = { params: Promise.resolve({ questItemId: "quest-1" }) };

describe("PATCH /api/v1/quest-items/:questItemId", () => {
  beforeEach(() => {
    mocks.authenticateRequest.mockReset();
    mocks.authorizeQuestItemOperation.mockReset();
    mocks.updateQuestItem.mockReset();
    mocks.authenticateRequest.mockResolvedValue({ source: "api_key", user: agent });
    mocks.authorizeQuestItemOperation.mockResolvedValue({ allowed: true });
    mocks.updateQuestItem.mockImplementation(async (id, input) => ({ id, ...input }));
  });

  it("rejects a null body with 400 instead of crashing", async () => {
    const response = await PATCH(patch("null"), context);
    expect(response.status).toBe(400);
    expect(mocks.updateQuestItem).not.toHaveBeenCalled();
  });

  it("rejects an unknown status with 400 and never persists it", async () => {
    const response = await PATCH(patch(JSON.stringify({ status: "archived" })), context);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "INVALID_REQUEST" } });
    expect(mocks.updateQuestItem).not.toHaveBeenCalled();
  });

  it("rejects an unknown category with 400 and never persists it", async () => {
    const response = await PATCH(patch(JSON.stringify({ category: "gadget" })), context);
    expect(response.status).toBe(400);
    expect(mocks.updateQuestItem).not.toHaveBeenCalled();
  });

  it("persists valid enums", async () => {
    const response = await PATCH(patch(JSON.stringify({ status: "unlocked", category: "tool" })), context);
    expect(response.status).toBe(200);
    expect(mocks.updateQuestItem).toHaveBeenCalledWith("quest-1", expect.objectContaining({ status: "unlocked", category: "tool" }));
  });
});
