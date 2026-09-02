import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { dataClient } from "@tloz/data";
import { authenticateSessionRequest } from "../../../../../../lib/api-auth";
import { GET, POST } from "./route";

vi.mock("@tloz/data", () => ({
  dataClient: { agent: { listApiKeys: vi.fn(), createApiKey: vi.fn() } },
}));
vi.mock("../../../../../../lib/api-auth", () => ({ authenticateSessionRequest: vi.fn() }));

const mockedAuth = vi.mocked(authenticateSessionRequest);
const mockedList = vi.mocked(dataClient.agent.listApiKeys);
const mockedCreate = vi.mocked(dataClient.agent.createApiKey);

const owner = { id: "owner-1", type: "human", role: "Platform Owner" } as const;

describe("/api/v1/users/me/api-keys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAuth.mockResolvedValue({ source: "session", user: owner } as never);
  });

  it("lists keys for the authenticated user", async () => {
    mockedList.mockResolvedValue([]);

    const response = await GET(new NextRequest("https://tloz.test/api/v1/users/me/api-keys"));

    expect(response.status).toBe(200);
    expect(mockedList).toHaveBeenCalledWith("owner-1");
  });

  it("creates a personal key with the current user as owner and creator", async () => {
    mockedCreate.mockResolvedValue({ key: "tloz_secret", apiKey: { id: "key-1" } } as never);

    const response = await POST(new NextRequest("https://tloz.test/api/v1/users/me/api-keys", {
      method: "POST",
      body: JSON.stringify({ name: "Benrod personal key" }),
      headers: { "content-type": "application/json" },
    }));

    expect(response.status).toBe(201);
    expect(mockedCreate).toHaveBeenCalledWith("owner-1", "Benrod personal key", "owner-1");
    await expect(response.json()).resolves.toMatchObject({ key: "tloz_secret" });
  });

  it("preserves unauthorized responses before touching the repository", async () => {
    mockedAuth.mockResolvedValue(NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 }));

    const response = await POST(new NextRequest("https://tloz.test/api/v1/users/me/api-keys", { method: "POST", body: "{}" }));

    expect(response.status).toBe(401);
    expect(mockedCreate).not.toHaveBeenCalled();
  });
});
