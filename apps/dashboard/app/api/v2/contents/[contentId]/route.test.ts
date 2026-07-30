import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authenticateRequest: vi.fn(), getContent: vi.fn(), listContents: vi.fn(), updateContent: vi.fn() }));
vi.mock("@tloz/data", async (importOriginal) => ({ ...await importOriginal<typeof import("@tloz/data")>(), dataClient: { containerContent: mocks } }));
vi.mock("../../../../../lib/api-auth", () => ({ authenticateRequest: mocks.authenticateRequest }));

import { GET, PATCH } from "./route";

const content = {
  id: "content-1", publicId: "TLO-0001", containerId: "container-1", presentation: "mission", title: "Mission", summary: "", body: "",
  data: { ownerId: "agent-1", status: "next" }, revision: 3, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("/api/v2/contents/:contentId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({ user: { id: "agent-1", type: "agent", role: "agent:operative" } });
    mocks.getContent.mockResolvedValue(content);
    mocks.listContents.mockResolvedValue([content]);
    mocks.updateContent.mockResolvedValue({ ...content, revision: 4, title: "Updated" });
  });

  it("returns an ETag for the current revision", async () => {
    const response = await GET(new NextRequest("https://tloz.test/api/v2/contents/TLO-0001"), { params: Promise.resolve({ contentId: "TLO-0001" }) });
    expect(response.status).toBe(200);
    expect(response.headers.get("etag")).toBe('"3"');
  });

  it("requires If-Match and updates through the canonical store", async () => {
    const response = await PATCH(new NextRequest("https://tloz.test/api/v2/contents/TLO-0001", {
      method: "PATCH", headers: { "Content-Type": "application/json", "If-Match": '"3"' }, body: JSON.stringify({ title: "Updated" }),
    }), { params: Promise.resolve({ contentId: "TLO-0001" }) });
    expect(response.status).toBe(200);
    expect(mocks.updateContent).toHaveBeenCalledWith("content-1", { title: "Updated" }, 3);
  });
});
