import type { ApiKey, UserProfile } from "@zipform/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  list: vi.fn(),
  listApiKeys: vi.fn(),
  createApiKey: vi.fn(),
  revokeApiKey: vi.fn()
}));

vi.mock("react", () => ({ cache: <T extends (...args: never[]) => unknown>(callback: T) => callback }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("../auth", () => ({ auth: mocks.auth }));
vi.mock("@zipform/data", () => ({
  dataClient: {
    agent: {
      list: mocks.list,
      listApiKeys: mocks.listApiKeys,
      createApiKey: mocks.createApiKey,
      revokeApiKey: mocks.revokeApiKey
    }
  }
}));

import { createAgentApiKey, listAgentApiKeys, listAgents, revokeAgentApiKey } from "./settings-actions";

const agentUser: UserProfile = {
  id: "zibot",
  name: "Zibot",
  username: "zibot",
  email: "zibot@zipform.dev",
  role: "agent:operative",
  type: "agent",
  avatarUrl: "",
  theme: "system"
};

const apiKey: ApiKey = {
  id: "key-1",
  userId: "zibot",
  createdByUserId: "owner",
  name: "Zibot production key",
  keyPrefix: "zaf_zibot_pro",
  createdAt: "2026-07-07T12:00:00.000Z",
  updatedAt: "2026-07-07T12:00:00.000Z"
};

describe("settings actions (agent)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listAgents", () => {
    it("returns agents when authenticated", async () => {
      mocks.auth.mockResolvedValue({ user: { id: "owner" } });
      mocks.list.mockResolvedValue([agentUser]);

      await expect(listAgents()).resolves.toEqual([agentUser]);
    });

    it("throws when not authenticated", async () => {
      mocks.auth.mockResolvedValue(null);

      await expect(listAgents()).rejects.toThrow("No autorizado");
      expect(mocks.list).not.toHaveBeenCalled();
    });
  });

  describe("listAgentApiKeys", () => {
    it("returns API keys when authenticated", async () => {
      mocks.auth.mockResolvedValue({ user: { id: "owner" } });
      mocks.listApiKeys.mockResolvedValue([apiKey]);

      await expect(listAgentApiKeys("zibot")).resolves.toEqual([apiKey]);
      expect(mocks.listApiKeys).toHaveBeenCalledWith("zibot");
    });

    it("throws when not authenticated", async () => {
      mocks.auth.mockResolvedValue(null);

      await expect(listAgentApiKeys("zibot")).rejects.toThrow("No autorizado");
    });
  });

  describe("createAgentApiKey", () => {
    it("creates an API key with the session user as creator", async () => {
      mocks.auth.mockResolvedValue({ user: { id: "owner" } });
      mocks.createApiKey.mockResolvedValue({ key: "zaf_abc123", apiKey });

      const result = await createAgentApiKey("zibot", "test key");
      expect(result).toEqual({ key: "zaf_abc123", apiKey });
      expect(mocks.createApiKey).toHaveBeenCalledWith("zibot", "test key", "owner");
    });

    it("throws when not authenticated", async () => {
      mocks.auth.mockResolvedValue(null);

      await expect(createAgentApiKey("zibot", "test key")).rejects.toThrow("No autorizado");
      expect(mocks.createApiKey).not.toHaveBeenCalled();
    });
  });

  describe("revokeAgentApiKey", () => {
    it("revokes an API key when authenticated", async () => {
      mocks.auth.mockResolvedValue({ user: { id: "owner" } });
      mocks.revokeApiKey.mockResolvedValue(undefined);

      await revokeAgentApiKey("key-1");
      expect(mocks.revokeApiKey).toHaveBeenCalledWith("key-1");
    });

    it("throws when not authenticated", async () => {
      mocks.auth.mockResolvedValue(null);

      await expect(revokeAgentApiKey("key-1")).rejects.toThrow("No autorizado");
    });
  });
});
