import { describe, expect, it } from "vitest";
import { authorizeApiRequest, isReadOnlyAgent, toPublicUserProfile } from "./authorization";

const reader = { type: "agent", role: "agent:reader" };
const operative = { type: "agent", role: "agent:operative" };

describe("authorization policy", () => {
  it("identifies only the reader agent role", () => {
    expect(isReadOnlyAgent(reader)).toBe(true);
    expect(isReadOnlyAgent(operative)).toBe(false);
    expect(isReadOnlyAgent({ type: "human", role: "agent:reader" })).toBe(false);
  });

  it("allows TLOZ reads, including POST query endpoints", () => {
    expect(authorizeApiRequest(new Request("https://zipform.test/api/v1/missions"), reader as never)).toBeNull();
    expect(authorizeApiRequest(new Request("https://zipform.test/api/v1/missions/query", { method: "POST" }), reader as never)).toBeNull();
  });

  it("rejects mutations and administrative surfaces for readers", async () => {
    const mutation = authorizeApiRequest(new Request("https://zipform.test/api/v1/missions", { method: "POST" }), reader as never);
    const agents = authorizeApiRequest(new Request("https://zipform.test/api/v1/agents"), reader as never);
    const outsideTloz = authorizeApiRequest(new Request("https://zipform.test/api/v1/apps"), reader as never);

    expect(mutation).toBeInstanceOf(Response);
    expect(agents).toBeInstanceOf(Response);
    expect(outsideTloz).toBeInstanceOf(Response);
    await expect(mutation?.json()).resolves.toMatchObject({ error: { code: "FORBIDDEN" } });
  });

  it("preserves full access for operative agents", () => {
    expect(authorizeApiRequest(new Request("https://zipform.test/api/v1/missions", { method: "POST" }), operative as never)).toBeNull();
  });

  it("removes email from public user profiles", () => {
    expect(toPublicUserProfile({
      id: "user-1",
      name: "Reader",
      username: "reader",
      email: "reader@zivelo.dev",
      role: "agent:reader",
      type: "agent",
      avatarUrl: "",
      theme: "system",
    })).toEqual({ id: "user-1", name: "Reader", username: "reader", role: "agent:reader", type: "agent", avatarUrl: "", theme: "system" });
  });
});
