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

const localUser = { id: "owner", name: "Owner", username: "owner", email: "owner@zipform.dev", role: "Owner", type: "human", avatarUrl: "", theme: "system" };
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
});
