import { afterEach, describe, expect, it, vi } from "vitest";
import { createTlozAttachmentStorage, validateAttachmentManifest } from "./tloz-attachment-storage";

describe("TLOZ attachment signed URLs", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("normalizes Supabase root-relative signed paths under /storage/v1", async () => {
    vi.stubEnv("SUPABASE_URL", "https://supabase.test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-test");
    vi.stubEnv("TLOZ_ATTACHMENTS_BUCKET", "tloz-attachments");
    const responses = [
      new Response(JSON.stringify({ url: "/object/upload/sign/tloz-attachments/file.png", token: "upload-token" }), { status: 200 }),
      new Response(JSON.stringify({ signedURL: "/object/sign/tloz-attachments/file.png" }), { status: 200 }),
    ];
    vi.stubGlobal("fetch", vi.fn(async () => responses.shift()!));
    const storage = createTlozAttachmentStorage();

    await expect(storage.createSignedUpload("file.png", "image/png")).resolves.toEqual({
      uploadUrl: "https://supabase.test/storage/v1/object/upload/sign/tloz-attachments/file.png?token=upload-token",
    });
    await expect(storage.createSignedRead("file.png", 3600)).resolves.toBe(
      "https://supabase.test/storage/v1/object/sign/tloz-attachments/file.png",
    );
  });

  it.each([400, 404])("treats Supabase HTTP %i as a missing object", async (status) => {
    vi.stubEnv("SUPABASE_URL", "https://supabase.test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-test");
    vi.stubEnv("TLOZ_ATTACHMENTS_BUCKET", "tloz-attachments");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status })));
    const storage = createTlozAttachmentStorage();

    await expect(storage.inspectObject("missions/mission-1/pr-57/missing.png")).resolves.toBeNull();
  });

  it("preserves unexpected Supabase inspection failures", async () => {
    vi.stubEnv("SUPABASE_URL", "https://supabase.test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-test");
    vi.stubEnv("TLOZ_ATTACHMENTS_BUCKET", "tloz-attachments");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 503 })));
    const storage = createTlozAttachmentStorage();

    await expect(storage.inspectObject("missions/mission-1/pr-57/file.png")).rejects.toMatchObject({
      code: "ATTACHMENT_STORAGE_ERROR",
      message: "Storage respondió HTTP 503.",
    });
  });
});

describe("TLOZ attachment manifest names", () => {
  const file = { key: "desktop", title: "Desktop", fileName: "desktop.png", contentType: "image/png", sizeBytes: 20, width: 1200, height: 800 };

  it("accepts and normalizes an optional client-defined group name", () => {
    expect(validateAttachmentManifest({ groupKey: "checkout", groupName: "  Checkout final  ", sourceRevision: "a".repeat(40), files: [file] })).toMatchObject({
      groupKey: "checkout",
      groupName: "Checkout final",
    });
  });

  it("preserves legacy manifests without a group name and rejects controls", () => {
    expect(validateAttachmentManifest({ groupKey: "legacy-group", sourceRevision: "a".repeat(40), files: [file] })).not.toHaveProperty("groupName");
    expect(() => validateAttachmentManifest({ groupKey: "checkout", groupName: "Checkout\nfinal", sourceRevision: "a".repeat(40), files: [file] })).toThrow(/groupName/);
  });
});
