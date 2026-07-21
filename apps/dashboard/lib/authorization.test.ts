import { describe, expect, it } from "vitest";
import {
  assertTlozOperation,
  authorizeApiRequest,
  authorizeTlozOperation,
  isReadOnlyAgent,
  TlozAuthorizationError,
  toPublicMissionOwner,
  toPublicUserProfile,
  type TlozOperation,
} from "./authorization";

const actors = {
  owner: { id: "owner-1", type: "human", role: "Platform Owner" },
  developer: { id: "developer-1", type: "human", role: "Full Stack Developer" },
  operative: { id: "operative-1", type: "agent", role: "agent:operative" },
  reader: { id: "reader-1", type: "agent", role: "agent:reader" },
  unknown: { id: "unknown-1", type: "human", role: "Guest" },
} as const;

function allowed(actor: (typeof actors)[keyof typeof actors], operation: TlozOperation, context = {}) {
  return authorizeTlozOperation(actor as never, operation, context).allowed;
}

describe("TLOZ authorization policy", () => {
  it("implements the role matrix with deny-by-default behavior", () => {
    const cases: Array<[keyof typeof actors, TlozOperation, Record<string, string>, boolean]> = [
      ["owner", "read", {}, true],
      ["developer", "read", {}, true],
      ["operative", "read", {}, true],
      ["reader", "read", {}, true],
      ["unknown", "read", {}, false],
      ["owner", "delete-mission", {}, true],
      ["developer", "delete-mission", {}, false],
      ["operative", "delete-mission", {}, false],
      ["reader", "delete-mission", {}, false],
      ["developer", "create", { requestedOwnerId: "developer-1" }, true],
      ["developer", "create", { requestedOwnerId: "owner-1" }, false],
      ["developer", "update", { ownerId: "developer-1" }, true],
      ["developer", "update", { ownerId: "owner-1" }, false],
      ["developer", "move", { ownerId: "developer-1" }, false],
      ["developer", "structure", {}, false],
      ["operative", "move", {}, true],
      ["operative", "structure", {}, true],
      ["reader", "mutate", {}, false],
      ["owner", "admin", {}, true],
      ["developer", "admin", {}, false],
      ["operative", "admin", {}, false],
      ["reader", "admin", {}, false],
      ["reader", "read-sensitive-user", {}, false],
      ["operative", "read-sensitive-user", {}, true],
    ];

    for (const [role, operation, context, expected] of cases) {
      expect(allowed(actors[role], operation, context), `${role} ${operation}`).toBe(expected);
    }
  });

  it("returns typed errors for expected Server Action denials", () => {
    expect(() => assertTlozOperation(actors.reader as never, "mutate"))
      .toThrowError(TlozAuthorizationError);
    try {
      assertTlozOperation(actors.operative as never, "delete-mission");
    } catch (error) {
      expect(error).toMatchObject({ code: "FORBIDDEN", status: 403 });
    }
  });

  it("allows semantic query reads but rejects reader mutations and admin routes", async () => {
    expect(authorizeApiRequest(new Request("https://zipform.test/api/v1/missions"), actors.reader as never)).toBeNull();
    expect(authorizeApiRequest(new Request("https://zipform.test/api/v1/missions/query", { method: "POST" }), actors.reader as never)).toBeNull();

    const mutation = authorizeApiRequest(new Request("https://zipform.test/api/v1/missions", { method: "POST" }), actors.reader as never);
    const agents = authorizeApiRequest(new Request("https://zipform.test/api/v1/agents"), actors.operative as never);
    expect(mutation).toBeInstanceOf(Response);
    expect(agents).toBeInstanceOf(Response);
    await expect(mutation?.json()).resolves.toMatchObject({ error: { code: "FORBIDDEN" } });
  });

  it("identifies only the exact reader agent role", () => {
    expect(isReadOnlyAgent(actors.reader as never)).toBe(true);
    expect(isReadOnlyAgent(actors.operative as never)).toBe(false);
    expect(isReadOnlyAgent({ id: "human", type: "human", role: "agent:reader" } as never)).toBe(false);
  });

  it("removes email from public user profiles and nested Mission owners", () => {
    const user = {
      id: "reader-1",
      name: "Reader",
      username: "reader",
      email: "reader@zivelo.dev",
      role: "agent:reader",
      type: "agent",
      avatarUrl: "",
      theme: "system",
    } as const;
    expect(toPublicUserProfile(user as never)).not.toHaveProperty("email");
    expect(toPublicMissionOwner({ id: "mission-1", owner: user as never })).toEqual({
      id: "mission-1",
      owner: expect.not.objectContaining({ email: expect.anything() }),
    });
  });
});
