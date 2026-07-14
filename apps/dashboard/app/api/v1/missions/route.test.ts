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
    dataClient: { tloz: { createMission: vi.fn(), findMissions: vi.fn(), getUsers: vi.fn(), getProjects: vi.fn(), getMissionDetail: vi.fn() } },
    TlozValidationError: ValidationError,
  };
});

vi.mock("../../../../lib/api-auth", () => ({
  authenticateRequest: vi.fn(),
}));

const mockedAuthenticateRequest = vi.mocked(authenticateRequest);
const mockedCreateMission = vi.mocked(dataClient.tloz.createMission);
const mockedGetUsers = vi.mocked(dataClient.tloz.getUsers);
const mockedGetProjects = vi.mocked(dataClient.tloz.getProjects);
const mockedGetMissionDetail = vi.mocked(dataClient.tloz.getMissionDetail);

describe("POST /api/v1/missions", () => {
  beforeEach(() => {
    mockedAuthenticateRequest.mockReset();
    mockedCreateMission.mockReset();
    mockedGetUsers.mockResolvedValue([{ id: "agent-1", username: "zibot" } as never]);
    mockedGetProjects.mockResolvedValue([{ id: "project-zivelo", slug: "zivelo" } as never]);
    mockedGetMissionDetail.mockResolvedValue({ id: "mission-1", checklistCount: 0, completed: 0 } as never);
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

  it("applies stable defaults while preserving explicit values", async () => {
    mockedCreateMission.mockResolvedValue({ id: "mission-1" } as never);

    const response = await POST(new NextRequest("https://zipform.test/api/v1/missions", {
      method: "POST",
      body: JSON.stringify({ title: "Mission", type: "side_quest" }),
      headers: { "Content-Type": "application/json" },
    }));

    expect(response.status).toBe(201);
    expect(mockedCreateMission).toHaveBeenCalledWith(expect.objectContaining({ ownerId: "agent-1", projectId: "project-zivelo", status: "later" }));

    await POST(new NextRequest("https://zipform.test/api/v1/missions", {
      method: "POST",
      body: JSON.stringify({ title: "Explicit", type: "side_quest", ownerId: "human-1", projectId: "project-1", status: "now" }),
      headers: { "Content-Type": "application/json" },
    }));
    expect(mockedCreateMission).toHaveBeenLastCalledWith(expect.objectContaining({ ownerId: "human-1", projectId: "project-1", status: "now" }));
  });

  it("forwards the complete atomic relationship and resource-icon payload", async () => {
    mockedCreateMission.mockResolvedValue({ id: "mission-1" } as never);
    const payload = {
      title: "Atomic mission",
      type: "side_quest",
      dependencyIds: ["mission-a"],
      requiredQuestItemIds: ["quest-a"],
      resources: [{ type: "link", title: "Repository", url: "https://github.com/org/repo", icon: "Github" }],
    };

    const response = await POST(new NextRequest("https://zipform.test/api/v1/missions", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    }));

    expect(response.status).toBe(201);
    expect(mockedCreateMission).toHaveBeenCalledWith(expect.objectContaining(payload));
  });
});
