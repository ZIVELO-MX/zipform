import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { dataClient } from "@tloz/data";
import { authenticateSessionRequest } from "../../../../../../../lib/api-auth";
import { DELETE } from "./route";

vi.mock("@tloz/data", () => ({ dataClient: { agent: { revokeApiKey: vi.fn() } } }));
vi.mock("../../../../../../../lib/api-auth", () => ({ authenticateSessionRequest: vi.fn() }));

const mockedAuth = vi.mocked(authenticateSessionRequest);
const mockedRevoke = vi.mocked(dataClient.agent.revokeApiKey);

describe("DELETE /api/v1/users/me/api-keys/:keyId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAuth.mockResolvedValue({ source: "session", user: { id: "owner-1", type: "human", role: "Platform Owner" } } as never);
  });

  it("revokes only a key owned by the current user", async () => {
    mockedRevoke.mockResolvedValue(true);

    const response = await DELETE(new NextRequest("https://tloz.test/api/v1/users/me/api-keys/key-1", { method: "DELETE" }), { params: Promise.resolve({ keyId: "key-1" }) });

    expect(response.status).toBe(200);
    expect(mockedRevoke).toHaveBeenCalledWith("key-1", "owner-1");
  });

  it("does not disclose a key owned by another user", async () => {
    mockedRevoke.mockResolvedValue(false);

    const response = await DELETE(new NextRequest("https://tloz.test/api/v1/users/me/api-keys/key-1", { method: "DELETE" }), { params: Promise.resolve({ keyId: "key-1" }) });

    expect(response.status).toBe(404);
  });
});
