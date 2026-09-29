import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  findResources: vi.fn(),
}));

vi.mock("@tloz/data", async (importOriginal) => ({
  ...await importOriginal<typeof import("@tloz/data")>(),
  dataClient: { tloz: { findResources: mocks.findResources } },
}));
vi.mock("../../../../../lib/api-auth", () => ({ authenticateRequest: mocks.authenticateRequest }));

import { POST } from "./route";

function query(body: unknown, raw?: string) {
  return POST(new NextRequest("https://tloz.test/api/v1/resources/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...(raw === undefined ? { body: JSON.stringify(body) } : { body: raw }),
  }));
}

describe("/api/v1/resources/query", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({ user: { id: "agent-1", type: "agent", role: "agent:operative" }, source: "session" });
    mocks.findResources.mockResolvedValue({ data: [], nextCursor: null });
  });

  it("filters with the documented q field", async () => {
    const response = await query({ q: "brief" });

    expect(response.status).toBe(200);
    expect(mocks.findResources).toHaveBeenCalledWith(
      expect.objectContaining({ query: "brief" }),
      expect.anything(),
    );
  });

  it("keeps the legacy query alias working", async () => {
    const response = await query({ query: "brief" });

    expect(response.status).toBe(200);
    expect(mocks.findResources).toHaveBeenCalledWith(
      expect.objectContaining({ query: "brief" }),
      expect.anything(),
    );
  });

  it("prefers q over the legacy alias", async () => {
    const response = await query({ q: "short", query: "legacy" });

    expect(response.status).toBe(200);
    expect(mocks.findResources).toHaveBeenCalledWith(
      expect.objectContaining({ query: "short" }),
      expect.anything(),
    );
  });

  it("rejects a malformed body before reaching the repository", async () => {
    const response = await query(undefined, "{oops");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "INVALID_REQUEST" } });
    expect(mocks.findResources).not.toHaveBeenCalled();
  });

  it("rejects an unsupported resource type", async () => {
    const response = await query({ type: "video" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "INVALID_REQUEST" } });
    expect(mocks.findResources).not.toHaveBeenCalled();
  });
});
