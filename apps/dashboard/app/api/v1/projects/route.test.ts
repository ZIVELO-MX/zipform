import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class ValidationError extends Error {
    constructor(public readonly fields: Record<string, string>) {
      super("Los datos de TLOZ no son válidos");
      this.name = "TlozValidationError";
    }
  }
  return {
    ValidationError,
    authenticateRequest: vi.fn(),
    authorizeApiOperation: vi.fn(),
    isFullStackDeveloper: vi.fn(),
    createProject: vi.fn(),
  };
});

vi.mock("@tloz/data", () => ({
  dataClient: { tloz: { createProject: mocks.createProject } },
  TlozValidationError: mocks.ValidationError,
}));
vi.mock("../../../../lib/api-auth", () => ({ authenticateRequest: mocks.authenticateRequest }));
vi.mock("../../../../lib/authorization", () => ({
  authorizeApiOperation: mocks.authorizeApiOperation,
  isFullStackDeveloper: mocks.isFullStackDeveloper,
}));

import { POST } from "./route";

const agent = {
  id: "agent-1",
  name: "Zibot",
  username: "zibot",
  email: "zibot@tloz.dev",
  role: "agent:operative",
  type: "agent",
  avatarUrl: "",
  theme: "system",
};

function post(body: string) {
  return new NextRequest("http://localhost/api/v1/projects", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

describe("POST /api/v1/projects", () => {
  beforeEach(() => {
    mocks.authenticateRequest.mockReset();
    mocks.authorizeApiOperation.mockReset();
    mocks.isFullStackDeveloper.mockReset();
    mocks.createProject.mockReset();
    mocks.authenticateRequest.mockResolvedValue({ source: "api_key", user: agent });
    mocks.authorizeApiOperation.mockReturnValue(null);
    mocks.isFullStackDeveloper.mockReturnValue(false);
    mocks.createProject.mockImplementation(async (input) => ({ id: "project-1", ...input }));
  });

  it("rejects a null body with 400 instead of crashing", async () => {
    const response = await POST(post("null"));
    expect(response.status).toBe(400);
    expect(mocks.createProject).not.toHaveBeenCalled();
  });

  it("maps store validation failures to 400 instead of 500", async () => {
    mocks.createProject.mockRejectedValue(new mocks.ValidationError({ ownerId: "Requerido." }));

    const response = await POST(post(JSON.stringify({ name: "Zipform" })));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "INVALID_REQUEST", fields: { ownerId: "Requerido." } },
    });
  });

  it("keeps unexpected store failures at 500", async () => {
    mocks.createProject.mockRejectedValue(new Error("connection lost"));

    const response = await POST(post(JSON.stringify({ name: "Zipform" })));
    expect(response.status).toBe(500);
  });

  it("rejects an unknown project status with 400", async () => {
    const response = await POST(post(JSON.stringify({ name: "Zipform", status: "on-hold" })));
    expect(response.status).toBe(400);
    expect(mocks.createProject).not.toHaveBeenCalled();
  });
});
