import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUsers: vi.fn(),
  authenticateWithApiKey: vi.fn(),
  auth: vi.fn(),
}));

vi.mock("@zipform/data", () => ({
  dataClient: {
    tloz: { getUsers: mocks.getUsers },
    agent: { authenticateWithApiKey: mocks.authenticateWithApiKey },
  },
}));
vi.mock("../auth", () => ({ auth: mocks.auth }));

import { authenticateRequest } from "./api-auth";

const localUser = { id: "owner", name: "Owner", username: "owner", email: "owner@zipform.dev", role: "Platform Owner", type: "human", avatarUrl: "", theme: "system" };
const readerUser = { id: "zileo", name: "Zileo", username: "zileo", email: "zileo@zivelo.dev", role: "agent:reader", type: "agent", avatarUrl: "", theme: "system" };
const ownerUser = { ...localUser, role: "Platform Owner" };
const mutableEnv = process.env as Record<string, string | undefined>;
const originalNodeEnv = mutableEnv.NODE_ENV;

describe("local API authentication", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.ZIPFORM_LOCAL_API_KEY;
    delete process.env.ZIPFORM_LOCAL_API_USER_ID;
    delete process.env.ZIPFORM_LOCAL_API_MODE;
    delete process.env.ZIPFORM_DATA_DRIVER;
    mocks.getUsers.mockReset();
    mocks.authenticateWithApiKey.mockReset();
    mocks.auth.mockReset();
  });

  it("accepts the local key only for the mock driver", async () => {
    process.env.ZIPFORM_DATA_DRIVER = "mock";
    process.env.ZIPFORM_LOCAL_API_MODE = "1";
    process.env.ZIPFORM_LOCAL_API_KEY = "zaf_test_local";
    mocks.getUsers.mockResolvedValue([localUser]);

    const result = await authenticateRequest(new NextRequest("http://localhost/api/v1/projects", {
      headers: { authorization: "Bearer zaf_test_local" },
    }));

    expect(result).toEqual({ user: localUser });
    expect(mocks.authenticateWithApiKey).not.toHaveBeenCalled();
  });

  it("rejects the local key in production", async () => {
    process.env.ZIPFORM_DATA_DRIVER = "mock";
    mutableEnv.NODE_ENV = "production";
    process.env.ZIPFORM_LOCAL_API_KEY = "zaf_test_local";
    mocks.getUsers.mockResolvedValue([localUser]);
    mocks.auth.mockResolvedValue(null);

    const result = await authenticateRequest(new NextRequest("http://localhost/api/v1/projects", {
      headers: { authorization: "Bearer zaf_test_local" },
    }));

    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) expect(result.status).toBe(401);
    if (originalNodeEnv === undefined) delete mutableEnv.NODE_ENV;
    else mutableEnv.NODE_ENV = originalNodeEnv;
  });

  it("rejects reader mutations while allowing semantic query reads", async () => {
    process.env.ZIPFORM_DATA_DRIVER = "prisma";
    mocks.authenticateWithApiKey.mockResolvedValue(readerUser);

    const mutation = await authenticateRequest(new NextRequest("http://localhost/api/v1/missions", {
      method: "POST",
      headers: { authorization: "Bearer zaf_reader" },
    }));
    expect(mutation).toBeInstanceOf(Response);
    if (mutation instanceof Response) expect(mutation.status).toBe(403);

    const query = await authenticateRequest(new NextRequest("http://localhost/api/v1/missions/query", {
      method: "POST",
      headers: { authorization: "Bearer zaf_reader" },
    }));
    expect(query).toEqual({ user: readerUser });
  });

  it("returns 401 for missing, malformed, invalid, and revoked credentials", async () => {
    process.env.ZIPFORM_DATA_DRIVER = "prisma";
    mocks.auth.mockResolvedValue(null);
    mocks.authenticateWithApiKey.mockResolvedValue(null);

    const requests = [
      new NextRequest("http://localhost/api/v1/missions"),
      new NextRequest("http://localhost/api/v1/missions", { headers: { authorization: "Basic invalid" } }),
      new NextRequest("http://localhost/api/v1/missions", { headers: { authorization: "Bearer invalid" } }),
      new NextRequest("http://localhost/api/v1/missions", { headers: { authorization: "Bearer revoked" } }),
    ];

    for (const request of requests) {
      const result = await authenticateRequest(request);
      expect(result).toBeInstanceOf(Response);
      if (result instanceof Response) {
        expect(result.status).toBe(401);
        await expect(result.json()).resolves.toMatchObject({
          error: { code: "UNAUTHORIZED", requestId: expect.any(String) },
        });
      }
    }
  });

  it("does not fall back to a session when an explicit API credential is invalid", async () => {
    process.env.ZIPFORM_DATA_DRIVER = "prisma";
    mocks.auth.mockResolvedValue({ user: { email: ownerUser.email } });
    mocks.getUsers.mockResolvedValue([ownerUser]);
    mocks.authenticateWithApiKey.mockResolvedValue(null);

    const result = await authenticateRequest(new NextRequest("http://localhost/api/v1/missions", {
      headers: { authorization: "Bearer invalid" },
    }));
    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) expect(result.status).toBe(401);
    expect(mocks.auth).not.toHaveBeenCalled();
  });

  it("denies every reader mutation family and administrative surface before routing", async () => {
    process.env.ZIPFORM_DATA_DRIVER = "prisma";
    mocks.authenticateWithApiKey.mockResolvedValue(readerUser);
    const mutations = [
      ["POST", "/api/v1/missions"],
      ["PATCH", "/api/v1/missions/mission-1"],
      ["DELETE", "/api/v1/missions/mission-1"],
      ["PATCH", "/api/v1/missions/mission-1/status"],
      ["PUT", "/api/v1/missions/mission-1/document"],
      ["POST", "/api/v1/missions/mission-1/dependencies"],
      ["POST", "/api/v1/missions/mission-1/quest-items"],
      ["POST", "/api/v1/missions/mission-1/resources"],
      ["POST", "/api/v1/missions/mission-1/attachments"],
      ["POST", "/api/v1/projects"],
      ["PATCH", "/api/v1/projects/project-1"],
      ["POST", "/api/v1/quest-items"],
      ["PATCH", "/api/v1/quest-items/item-1"],
      ["GET", "/api/v1/agents"],
      ["GET", "/api/v1/agents/agent-1/api-keys"],
      ["POST", "/api/v1/agents/agent-1/api-keys"],
      ["DELETE", "/api/v1/agents/agent-1/api-keys/key-1"],
    ] as const;

    for (const [method, path] of mutations) {
      const result = await authenticateRequest(new NextRequest(`http://localhost${path}`, {
        method,
        headers: { authorization: "Bearer zaf_reader" },
      }));
      expect(result).toBeInstanceOf(Response);
      if (result instanceof Response) expect(result.status, `${method} ${path}`).toBe(403);
    }
  });

  it("allows all global read families for readers", async () => {
    process.env.ZIPFORM_DATA_DRIVER = "prisma";
    mocks.authenticateWithApiKey.mockResolvedValue(readerUser);
    const paths = ["projects", "missions", "quest-items", "resources", "seasons", "episodes", "users"];
    for (const path of paths) {
      await expect(authenticateRequest(new NextRequest(`http://localhost/api/v1/${path}`, {
        headers: { authorization: "Bearer zaf_reader" },
      }))).resolves.toEqual({ user: readerUser });
    }
  });

  it("allows only Platform Owners into agent administration", async () => {
    process.env.ZIPFORM_DATA_DRIVER = "prisma";
    mocks.authenticateWithApiKey.mockResolvedValue(ownerUser);
    await expect(authenticateRequest(new NextRequest("http://localhost/api/v1/agents", {
      headers: { authorization: "Bearer zaf_owner" },
    }))).resolves.toEqual({ user: ownerUser });
  });
});
