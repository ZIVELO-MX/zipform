import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { dataClient } from "@tloz/data";
import type { UserProfile } from "@tloz/types";
import { authenticateRequest } from "../../../../lib/api-auth";
import { GET } from "./route";

vi.mock("@tloz/data", () => ({
  dataClient: {
    canonicalDocuments: { find: vi.fn(), get: vi.fn() },
    tloz: { findResources: vi.fn() },
  },
  PaginationCursorError: class PaginationCursorError extends Error {},
}));

vi.mock("../../../../lib/api-auth", () => ({ authenticateRequest: vi.fn() }));

const auth = vi.mocked(authenticateRequest);
const findDocuments = vi.mocked(dataClient.canonicalDocuments.find);
const getDocument = vi.mocked(dataClient.canonicalDocuments.get);
const findResources = vi.mocked(dataClient.tloz.findResources);

const actor: UserProfile = { id: "agent-1", name: "Zibot", username: "zibot", email: "zibot@tloz.dev", role: "agent:operative", type: "agent", avatarUrl: "", theme: "system" };

describe("GET /api/v1/search", () => {
  beforeEach(() => {
    auth.mockResolvedValue({ user: actor, source: "session" });
    findDocuments.mockResolvedValue({ data: [], nextCursor: null });
    findResources.mockResolvedValue({ data: [], nextCursor: null });
    getDocument.mockResolvedValue(null);
  });

  it("keeps an empty query bounded and does not hydrate collections", async () => {
    const response = await GET(new NextRequest("https://tloz.test/api/v1/search"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: [], nextCursor: null });
    expect(findDocuments).not.toHaveBeenCalled();
    expect(findResources).not.toHaveBeenCalled();
  });

  it("returns canonical destinations and resource owner context", async () => {
    findDocuments.mockResolvedValue({
      data: [{ id: "mission-1", publicId: "TLO-0012", kind: "mission", projectSlug: "tloz", title: "Búsqueda", summary: "", body: "", revision: 1, properties: {}, createdAt: "2026-01-01", updatedAt: "2026-01-01" } as never],
      nextCursor: null,
    });
    findResources.mockResolvedValue({ data: [{ id: "resource-1", missionId: "mission-1", type: "link", title: "Brief", createdAt: "2026-01-01", updatedAt: "2026-01-01" } as never], nextCursor: null });
    getDocument.mockResolvedValue({ id: "mission-1", publicId: "TLO-0012", kind: "mission", projectSlug: "tloz", title: "Búsqueda", summary: "", body: "", revision: 1, properties: {}, createdAt: "2026-01-01", updatedAt: "2026-01-01" } as never);

    const response = await GET(new NextRequest("https://tloz.test/api/v1/search?q=busqueda&limit=10"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: [
        { type: "mission", destination: "/tloz/TLO-0012" },
        { type: "resource", context: "Recurso · Búsqueda", destination: "/tloz/TLO-0012" },
      ],
      nextCursor: null,
    });
  });

  it("rejects short queries and malformed composite cursors", async () => {
    expect((await GET(new NextRequest("https://tloz.test/api/v1/search?q=x"))).status).toBe(400);
    findDocuments.mockClear();
    expect((await GET(new NextRequest("https://tloz.test/api/v1/search?q=ok&cursor=bad"))).status).toBe(400);
    expect(findDocuments).not.toHaveBeenCalled();
  });
});
