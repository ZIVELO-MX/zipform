import type { ApiKey, UserProfile } from "@zipform/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  list: vi.fn(),
  listApiKeys: vi.fn(),
  createApiKey: vi.fn(),
  revokeApiKey: vi.fn(),
  listAvatars: vi.fn()
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
    },
    platform: {
      listAvatars: mocks.listAvatars
    }
  }
}));

import { createAgentApiKey, listAgentApiKeys, listAgents, listAvatars, revokeAgentApiKey } from "./settings-actions";

const agentUser: UserProfile = {
  id: "d5ca1936-3240-4247-8c2b-a7152a681311",
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
  userId: "d5ca1936-3240-4247-8c2b-a7152a681311",
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

      await expect(listAgentApiKeys("d5ca1936-3240-4247-8c2b-a7152a681311")).resolves.toEqual([apiKey]);
      expect(mocks.listApiKeys).toHaveBeenCalledWith("d5ca1936-3240-4247-8c2b-a7152a681311");
    });

    it("throws when not authenticated", async () => {
      mocks.auth.mockResolvedValue(null);

      await expect(listAgentApiKeys("d5ca1936-3240-4247-8c2b-a7152a681311")).rejects.toThrow("No autorizado");
    });
  });

  describe("createAgentApiKey", () => {
    it("creates an API key with the session user as creator", async () => {
      mocks.auth.mockResolvedValue({ user: { id: "owner" } });
      mocks.createApiKey.mockResolvedValue({ key: "zaf_abc123", apiKey });

      const result = await createAgentApiKey("d5ca1936-3240-4247-8c2b-a7152a681311", "test key");
      expect(result).toEqual({ key: "zaf_abc123", apiKey });
      expect(mocks.createApiKey).toHaveBeenCalledWith("d5ca1936-3240-4247-8c2b-a7152a681311", "test key", "owner");
    });

    it("throws when not authenticated", async () => {
      mocks.auth.mockResolvedValue(null);

      await expect(createAgentApiKey("d5ca1936-3240-4247-8c2b-a7152a681311", "test key")).rejects.toThrow("No autorizado");
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

  describe("listAvatars", () => {
    it("returns avatars when authenticated", async () => {
      mocks.auth.mockResolvedValue({ user: { id: "owner" } });
      mocks.listAvatars.mockResolvedValue([
        { id: "s1", name: "Semielfo", imageUrl: "https://pujkknhxrqmeckyiqxte.supabase.co/storage/v1/object/public/PFP/Semielfo.jpeg" },
        { id: "s2", name: "Dragon", imageUrl: "https://pujkknhxrqmeckyiqxte.supabase.co/storage/v1/object/public/PFP/Dragon.jpeg" },
        { id: "s3", name: "ZIBOT", imageUrl: "https://pujkknhxrqmeckyiqxte.supabase.co/storage/v1/object/public/PFP/Zibot.jpeg" }
      ]);

      const result = await listAvatars();
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe("Semielfo");
    });

    it("throws when not authenticated", async () => {
      mocks.auth.mockResolvedValue(null);

      await expect(listAvatars()).rejects.toThrow("No autorizado");
      expect(mocks.listAvatars).not.toHaveBeenCalled();
    });
  });
});
