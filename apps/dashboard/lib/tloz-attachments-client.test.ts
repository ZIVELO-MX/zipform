import { describe, expect, it, vi } from "vitest";
import {
  AttachmentClientError,
  buildAttachmentManifest,
  createAttachmentKey,
  createAttachmentRevision,
  prepareAttachmentBatch,
  uploadAttachmentFile,
  validateAttachmentCount,
  validateAttachmentFile,
  type AttachmentUploadItem,
} from "./tloz-attachments-client";

function item(key = "home") {
  const file = new File(["png-bytes"], `${key}.png`, { type: "image/png" });
  return { key, title: key, fileName: file.name, contentType: "image/png" as const, sizeBytes: file.size, width: 120, height: 80, file } satisfies AttachmentUploadItem;
}

describe("TLOZ attachment client", () => {
  it("creates contract-safe keys and opaque 40-character revisions", () => {
    expect(createAttachmentKey("Mi captura final.png")).toMatch(/^[a-z0-9-]+-[a-f0-9]{12}$/);
    expect(createAttachmentRevision()).toMatch(/^[a-f0-9]{40}$/);
  });

  it("validates type, size and unique batch keys", () => {
    expect(validateAttachmentFile(item().file)).toBe("image/png");
    expect(() => validateAttachmentFile(new File(["x"], "bad.gif", { type: "image/gif" }))).toThrow(/PNG/);
    expect(() => validateAttachmentCount([item("same"), item("same")])).toThrow(/única/);
    expect(() => validateAttachmentCount([])).toThrow(/entre 1 y 20/);
  });

  it("builds a manifest without sending File objects", () => {
    const manifest = buildAttachmentManifest("manual-group", "a".repeat(40), [item()]);
    expect(manifest).toMatchObject({ groupKey: "manual-group", sourceRevision: "a".repeat(40), files: [{ key: "home", sizeBytes: 9 }] });
    expect(manifest.files[0]).not.toHaveProperty("file");
  });

  it("uses the session API for preparation and exact MIME for direct upload", async () => {
    const requestFetch = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { uploadBatchId: "batch-1", generation: 1, groupKey: "manual-group", sourceRevision: "a".repeat(40), status: "prepared", uploads: [{ key: "home", fileName: "home.png", contentType: "image/png", sizeBytes: 9, uploadUrl: "https://storage.test/upload" }] } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const batch = await prepareAttachmentBatch("mission-1", buildAttachmentManifest("manual-group", "a".repeat(40), [item()]), undefined, requestFetch);
    expect(batch.uploadBatchId).toBe("batch-1");
    expect(requestFetch.mock.calls[0]?.[0]).toBe("/api/v1/missions/mission-1/attachments");
    await uploadAttachmentFile(batch.uploads[0]!, item().file, undefined, requestFetch);
    expect(requestFetch.mock.calls[1]?.[1]).toMatchObject({ method: "PUT", credentials: "omit", headers: { "Content-Type": "image/png" } });
  });

  it("sanitizes API errors instead of exposing response details", async () => {
    const requestFetch = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ error: { code: "FORBIDDEN", message: "secret storage path", requestId: "req-1" } }), { status: 403 }));
    let error: AttachmentClientError | undefined;
    try {
      await prepareAttachmentBatch("mission-1", buildAttachmentManifest("manual-group", "a".repeat(40), [item()]), undefined, requestFetch);
    } catch (value) {
      error = value as AttachmentClientError;
    }
    expect(error).toBeDefined();
    const captured = error!;
    expect(captured).toMatchObject({ code: "FORBIDDEN", status: 403, requestId: "req-1" });
    expect(captured.message).toContain("No tienes permiso");
    expect(captured.message).not.toContain("secret storage path");
    expect(new AttachmentClientError("x", "x", 400, "prepare")).toBeInstanceOf(Error);
  });
});
