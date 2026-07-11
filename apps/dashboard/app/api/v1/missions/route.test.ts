import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { dataClient, TlozValidationError } from "@zipform/data";
import { authenticateRequest } from "../../../../lib/api-auth";
import { POST } from "./route";

vi.mock("@zipform/data", () => {
  class ValidationError extends Error {
    constructor(public readonly fields: Record<string, string>) {
      super("Invalid TLOZ data");
    }
  }

  return {
    dataClient: { tloz: { createMission: vi.fn(), findMissions: vi.fn() } },
    TlozValidationError: ValidationError,
  };
});

vi.mock("../../../../lib/api-auth", () => ({
  authenticateRequest: vi.fn(),
}));

const mockedAuthenticateRequest = vi.mocked(authenticateRequest);
const mockedCreateMission = vi.mocked(dataClient.tloz.createMission);

describe("POST /api/v1/missions", () => {
  beforeEach(() => {
    mockedAuthenticateRequest.mockReset();
    mockedCreateMission.mockReset();
    mockedAuthenticateRequest.mockResolvedValue({
      user: {
        id: "agent-1",
        name: "Zibot",
        username: "zibot",
        email: "zibot@zipform.dev",
        role: "agent:operative",
        type: "agent",
        avatarUrl: "",
        theme: "system",
      },
    });
  });

  it("returns field guidance for expected validation failures", async () => {
    mockedCreateMission.mockRejectedValue(new TlozValidationError({
      projectId: "El proyecto es obligatorio.",
    }));

    const response = await POST(new NextRequest("https://zipform.test/api/v1/missions", {
      method: "POST",
      body: JSON.stringify({ title: "Mission", ownerId: "agent-1", type: "side_quest" }),
      headers: { "Content-Type": "application/json" },
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        code: "INVALID_REQUEST",
        message: "Corrige los campos indicados.",
        fields: { projectId: expect.any(String) },
      },
    });
  });

  it("does not expose unexpected internal error details", async () => {
    mockedCreateMission.mockRejectedValue(new Error("database connection string leaked"));

    const response = await POST(new NextRequest("https://zipform.test/api/v1/missions", {
      method: "POST",
      body: JSON.stringify({ title: "Mission", ownerId: "agent-1", type: "side_quest", projectId: "project-1" }),
      headers: { "Content-Type": "application/json" },
    }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toMatchObject({ error: { code: "INTERNAL_ERROR", message: "Error interno del servidor." } });
    expect(JSON.stringify(body)).not.toContain("database connection string");
  });
});
