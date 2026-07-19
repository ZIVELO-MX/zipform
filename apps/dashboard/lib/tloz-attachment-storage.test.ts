import { afterEach, describe, expect, it, vi } from "vitest";
import { createTlozAttachmentStorage } from "./tloz-attachment-storage";

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
});
