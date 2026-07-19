import { beforeEach, describe, expect, it, vi } from "vitest";
import { dataClient } from "@zipform/data";
import { authenticateRequest } from "../../../../../../lib/api-auth";
import { getTlozAttachmentStorage } from "../../../../../../lib/tloz-attachment-storage";
import { POST, PUT } from "./route";

vi.mock("@zipform/data", () => ({
  dataClient: { tloz: { prepareAttachmentBatch: vi.fn(), getAttachmentBatch: vi.fn(), finalizeAttachmentBatch: vi.fn(), getAttachmentGroups: vi.fn() } },
  TlozAttachmentError: class TlozAttachmentError extends Error { code: string; constructor(code: string, message: string) { super(message); this.code = code; } },
}));
vi.mock("../../../../../../lib/api-auth", () => ({ authenticateRequest: vi.fn() }));
vi.mock("../../../../../../lib/tloz-attachment-storage", async () => {
  const actual = await vi.importActual<typeof import("../../../../../../lib/tloz-attachment-storage")>("../../../../../../lib/tloz-attachment-storage");
  return { ...actual, getTlozAttachmentStorage: vi.fn() };
});

const manifest = {
  groupKey: "pr-57",
  sourceRevision: "0123456789abcdef0123456789abcdef01234567",
  files: [{ key: "home-desktop", title: "Home desktop", fileName: "home.png", contentType: "image/png", sizeBytes: 1024, width: 1440, height: 900 }],
} as const;

describe("/api/v1/missions/:missionId/attachments", () => {
  const storage = {
    createSignedUpload: vi.fn(),
    inspectObject: vi.fn(),
    createSignedRead: vi.fn(),
    removeObject: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authenticateRequest).mockResolvedValue({ user: { id: "agent-1" } } as never);
    vi.mocked(getTlozAttachmentStorage).mockReturnValue(storage);
    storage.createSignedUpload.mockResolvedValue({ uploadUrl: "https://storage.test/upload" });
    storage.inspectObject.mockResolvedValue({ contentType: "image/png", sizeBytes: 1024 });
    storage.createSignedRead.mockResolvedValue("https://storage.test/read");
    storage.removeObject.mockResolvedValue(undefined);
    vi.mocked(dataClient.tloz.prepareAttachmentBatch).mockResolvedValue({ uploadBatchId: "batch-1", missionId: "mission-1", groupKey: "pr-57", sourceRevision: manifest.sourceRevision, generation: 1, status: "prepared", files: [{ ...manifest.files[0], storagePath: "missions/mission-1/pr-57/home-desktop/id.png" }] });
  });

  it("rejects invalid manifests before creating signed URLs", async () => {
    const response = await POST(new Request("https://zipform.test/api/v1/missions/mission-1/attachments", { method: "POST", body: JSON.stringify({ ...manifest, files: [{ ...manifest.files[0], contentType: "image/svg+xml" }] }) }), { params: Promise.resolve({ missionId: "mission-1" }) });
    expect(response.status).toBe(400);
    expect(storage.createSignedUpload).not.toHaveBeenCalled();
    expect(dataClient.tloz.prepareAttachmentBatch).not.toHaveBeenCalled();
  });

  it("prepares a direct-upload batch without receiving image bytes", async () => {
    const response = await POST(new Request("https://zipform.test/api/v1/missions/mission-1/attachments", { method: "POST", body: JSON.stringify(manifest) }), { params: Promise.resolve({ missionId: "mission-1" }) });
    expect(response.status).toBe(200);
    expect(dataClient.tloz.prepareAttachmentBatch).toHaveBeenCalledWith("mission-1", "pr-57", manifest.sourceRevision, expect.arrayContaining([expect.objectContaining({ key: "home-desktop", storagePath: expect.stringContaining("missions/mission-1/pr-57/home-desktop/") })]));
    await expect(response.json()).resolves.toMatchObject({ data: { uploadBatchId: "batch-1", uploads: [{ key: "home-desktop", uploadUrl: "https://storage.test/upload" }] } });
  });

  it("does not finalize a batch when an uploaded object is missing", async () => {
    vi.mocked(dataClient.tloz.getAttachmentBatch).mockResolvedValue({ uploadBatchId: "batch-1", missionId: "mission-1", groupKey: "pr-57", sourceRevision: manifest.sourceRevision, generation: 1, status: "prepared", files: [{ ...manifest.files[0], storagePath: "missions/mission-1/pr-57/home-desktop/id.png" }] });
    storage.inspectObject.mockResolvedValue(null);
    const response = await PUT(new Request("https://zipform.test/api/v1/missions/mission-1/attachments", { method: "PUT", body: JSON.stringify({ uploadBatchId: "batch-1" }) }), { params: Promise.resolve({ missionId: "mission-1" }) });
    expect(response.status).toBe(400);
    expect(dataClient.tloz.finalizeAttachmentBatch).not.toHaveBeenCalled();
  });

  it("verifies object metadata before finalizing and returns signed reads", async () => {
    vi.mocked(dataClient.tloz.getAttachmentBatch).mockResolvedValue({ uploadBatchId: "batch-1", missionId: "mission-1", groupKey: "pr-57", sourceRevision: manifest.sourceRevision, generation: 1, status: "prepared", files: [{ ...manifest.files[0], storagePath: "missions/mission-1/pr-57/home-desktop/id.png" }] });
    vi.mocked(dataClient.tloz.finalizeAttachmentBatch).mockResolvedValue({
      batch: { uploadBatchId: "batch-1", missionId: "mission-1", groupKey: "pr-57", sourceRevision: manifest.sourceRevision, generation: 1, status: "finalized", files: [{ ...manifest.files[0], storagePath: "missions/mission-1/pr-57/home-desktop/id.png" }] },
      group: { groupKey: "pr-57", sourceRevision: manifest.sourceRevision, generation: 1, attachments: [{ id: "resource-1", missionId: "mission-1", type: "image", title: "Home desktop", storagePath: "missions/mission-1/pr-57/home-desktop/id.png", externalKey: "home-desktop", groupKey: "pr-57", contentType: "image/png", sizeBytes: 1024, width: 1440, height: 900, sourceRevision: manifest.sourceRevision, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z", url: "" }] },
      previousStoragePaths: ["missions/mission-1/pr-57/home-desktop/old.png"],
    });
    const response = await PUT(new Request("https://zipform.test/api/v1/missions/mission-1/attachments", { method: "PUT", body: JSON.stringify({ uploadBatchId: "batch-1" }) }), { params: Promise.resolve({ missionId: "mission-1" }) });
    expect(response.status).toBe(200);
    expect(storage.inspectObject).toHaveBeenCalledWith("missions/mission-1/pr-57/home-desktop/id.png");
    expect(storage.removeObject).toHaveBeenCalledWith("missions/mission-1/pr-57/home-desktop/old.png");
    const body = await response.json();
    expect(body).toMatchObject({ data: { groupKey: "pr-57", attachments: [{ id: "resource-1", url: "https://storage.test/read" }] } });
    expect(body.data.attachments[0]).not.toHaveProperty("storagePath");
  });
});
