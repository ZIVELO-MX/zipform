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
    createQuestItem: vi.fn(),
  };
});

vi.mock("@tloz/data", () => ({
  dataClient: { tloz: { createQuestItem: mocks.createQuestItem } },
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

function request(body: string) {
  return new NextRequest("http://localhost/api/v1/quest-items", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

function jsonBody(value: unknown) {
  return request(JSON.stringify(value));
}

describe("POST /api/v1/quest-items", () => {
  beforeEach(() => {
    mocks.authenticateRequest.mockReset();
    mocks.authorizeApiOperation.mockReset();
    mocks.isFullStackDeveloper.mockReset();
    mocks.createQuestItem.mockReset();
    mocks.authenticateRequest.mockResolvedValue({ source: "api_key", user: agent });
    mocks.authorizeApiOperation.mockReturnValue(null);
    mocks.isFullStackDeveloper.mockReturnValue(false);
    mocks.createQuestItem.mockImplementation(async (input) => ({ id: "quest-1", ...input }));
  });

  it("rejects a null body with 400 instead of crashing", async () => {
    const response = await POST(request("null"));
    expect(response.status).toBe(400);
    expect(mocks.createQuestItem).not.toHaveBeenCalled();
  });

  it("rejects a non-object body with 400", async () => {
    const response = await POST(request("[1,2]"));
    expect(response.status).toBe(400);
    expect(mocks.createQuestItem).not.toHaveBeenCalled();
  });

  it("rejects an unknown inventory status with 400", async () => {
    const response = await POST(jsonBody({ name: "Llave SSH", status: "archived" }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "INVALID_REQUEST" } });
    expect(mocks.createQuestItem).not.toHaveBeenCalled();
  });

  it("rejects an unknown inventory category with 400", async () => {
    const response = await POST(jsonBody({ name: "Llave SSH", category: "gadget" }));
    expect(response.status).toBe(400);
    expect(mocks.createQuestItem).not.toHaveBeenCalled();
  });

  it("maps store validation failures to 400 with the offending fields", async () => {
    mocks.createQuestItem.mockRejectedValue(new mocks.ValidationError({ description: "Requerido." }));

    const response = await POST(jsonBody({ name: "Llave SSH" }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "INVALID_REQUEST", fields: { description: "Requerido." } },
    });
  });

  it("keeps valid inventory enums on the happy path", async () => {
    const response = await POST(jsonBody({ name: "Llave SSH", status: "unlocked", category: "access" }));
    expect(response.status).toBe(201);
    expect(mocks.createQuestItem).toHaveBeenCalledWith(expect.objectContaining({ status: "unlocked", category: "access" }));
  });
});
