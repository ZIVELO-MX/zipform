import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { dataClient, PaginationCursorError } from "@tloz/data";
import { authenticateRequest } from "../../../../../lib/api-auth";
import { POST } from "./route";

vi.mock("@tloz/data", () => {
  class CursorError extends Error {
    constructor(public readonly cursor: string) {
      super("El cursor no pertenece a la colección solicitada.");
    }
  }

  return {
    dataClient: { tloz: { findMissions: vi.fn() } },
    PaginationCursorError: CursorError,
  };
});

vi.mock("../../../../../lib/api-auth", () => ({
  authenticateRequest: vi.fn(),
}));

const mockedAuthenticateRequest = vi.mocked(authenticateRequest);
const mockedFindMissions = vi.mocked(dataClient.tloz.findMissions);

describe("POST /api/v1/missions/query", () => {
  beforeEach(() => {
    mockedAuthenticateRequest.mockReset();
    mockedFindMissions.mockReset();
    mockedAuthenticateRequest.mockResolvedValue({
      user: { id: "agent-1", type: "agent", role: "agent:operative" },
    } as never);
  });

  it("returns 400 when the repository rejects an invalid cursor", async () => {
    mockedFindMissions.mockRejectedValue(new PaginationCursorError("missing"));

    const response = await POST(new NextRequest("https://tloz.test/api/v1/missions/query", {
      method: "POST",
      body: JSON.stringify({ cursor: "missing" }),
      headers: { "Content-Type": "application/json" },
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "INVALID_REQUEST",
        fields: { cursor: "invalid" },
      },
    });
  });
});
