import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUsers: vi.fn(),
  updateUserRole: vi.fn(),
  authenticateWithApiKey: vi.fn(),
}));

vi.mock("@zipform/data", () => ({ dataClient: { tloz: { getUsers: mocks.getUsers, updateUserRole: mocks.updateUserRole }, agent: { authenticateWithApiKey: mocks.authenticateWithApiKey } } }));
vi.mock("../../../../../../auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));

import { PATCH } from "./route";

const owner = { id: "owner", name: "Owner", username: "owner", email: "owner@example.com", role: "Platform Owner", type: "human", avatarUrl: "", theme: "system" } as const;
const operative = { id: "zibot", name: "Zibot", username: "zibot", email: "zibot@example.com", role: "agent:operative", type: "agent", avatarUrl: "", theme: "system" } as const;
const developer = { id: "rulaxx", name: "Rulaxx", username: "Rulaxx", email: "rulaxx@example.com", role: "Full Stack Developer", type: "human", avatarUrl: "", theme: "system" } as const;

describe("PATCH /users/:userId/role", () => {
  beforeEach(() => {
    mocks.getUsers.mockReset();
    mocks.updateUserRole.mockReset();
    mocks.authenticateWithApiKey.mockReset();
    mocks.authenticateWithApiKey.mockResolvedValue(operative);
    mocks.getUsers.mockResolvedValue([owner, operative, developer]);
    mocks.updateUserRole.mockImplementation(async (id: string, role: string) => ({ ...(id === developer.id ? developer : owner), role }));
  });

  it("allows an operative to promote a non-owner human", async () => {
    const response = await PATCH(new NextRequest("http://localhost/api/v1/users/rulaxx/role", {
      method: "PATCH",
      headers: { authorization: "Bearer zaf_operative", "content-type": "application/json" },
      body: JSON.stringify({ role: "Platform Owner" }),
    }), { params: Promise.resolve({ userId: "rulaxx" }) });
    expect(response.status).toBe(200);
    expect(mocks.updateUserRole).toHaveBeenCalledWith("rulaxx", "Platform Owner");
  });

  it("protects self, existing owners, incompatible roles, and the last owner", async () => {
    for (const [userId, role, expected] of [["zibot", "agent:reader", 403], ["owner", "Full Stack Developer", 403], ["rulaxx", "agent:reader", 400]] as const) {
      const response = await PATCH(new NextRequest(`http://localhost/api/v1/users/${userId}/role`, {
        method: "PATCH", headers: { authorization: "Bearer zaf_operative", "content-type": "application/json" }, body: JSON.stringify({ role }),
      }), { params: Promise.resolve({ userId }) });
      expect(response.status).toBe(expected);
    }
    mocks.getUsers.mockResolvedValue([owner, operative]);
    mocks.authenticateWithApiKey.mockResolvedValue(owner);
    const response = await PATCH(new NextRequest("http://localhost/api/v1/users/owner/role", {
      method: "PATCH", headers: { authorization: "Bearer zaf_owner", "content-type": "application/json" }, body: JSON.stringify({ role: "Full Stack Developer" }),
    }), { params: Promise.resolve({ userId: "owner" }) });
    expect(response.status).toBe(409);
  });
});
