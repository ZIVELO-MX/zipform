import type { UserProfile } from "@zipform/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getCurrent: vi.fn(),
  getUsers: vi.fn()
}));

vi.mock("react", () => ({ cache: <T extends (...args: never[]) => unknown>(callback: T) => callback }));
vi.mock("../auth", () => ({ auth: mocks.auth }));
vi.mock("@zipform/data", () => ({
  dataClient: {
    tloz: { getUsers: mocks.getUsers },
    user: { getCurrent: mocks.getCurrent }
  }
}));

import { getCurrentUser } from "./data";

const authenticatedUser: UserProfile = {
  id: "user-1",
  name: "Authenticated User",
  username: "authenticated",
  email: "user@example.com",
  role: "member",
  type: "human",
  avatarUrl: ""
};

const fallbackUser: UserProfile = {
  id: "user-2",
  name: "Fallback User",
  username: "fallback",
  email: "fallback@example.com",
  role: "member",
  type: "human",
  avatarUrl: ""
};

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUsers.mockResolvedValue([authenticatedUser]);
    mocks.getCurrent.mockResolvedValue(fallbackUser);
  });

  it("returns the user matching the normalized session email", async () => {
    mocks.auth.mockResolvedValue({ user: { email: " USER@EXAMPLE.COM " } });

    await expect(getCurrentUser()).resolves.toEqual(authenticatedUser);
    expect(mocks.getCurrent).not.toHaveBeenCalled();
  });

  it.each([null, {}, { user: undefined }])(
    "falls back when the session has no usable user identity: %j",
    async (session) => {
      mocks.auth.mockResolvedValue(session);

      await expect(getCurrentUser()).resolves.toEqual(fallbackUser);
      expect(mocks.getUsers).not.toHaveBeenCalled();
    }
  );

  it("falls back when no data user matches the session email", async () => {
    mocks.auth.mockResolvedValue({ user: { email: "missing@example.com" } });

    await expect(getCurrentUser()).resolves.toEqual(fallbackUser);
    expect(mocks.getUsers).toHaveBeenCalledOnce();
  });
});
