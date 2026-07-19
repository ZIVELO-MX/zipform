import assert from "node:assert/strict";
import test from "node:test";
import { ensureTlozAttachmentsBucket, TLOZ_ATTACHMENTS_BUCKET } from "./ensure-tloz-attachments-bucket.mjs";

test("creates and constrains the private TLOZ attachments bucket idempotently", async () => {
  const requests = [];
  const responses = [
    new Response("not found", { status: 404 }),
    new Response("created", { status: 201 }),
    new Response("updated", { status: 200 }),
  ];
  const result = await ensureTlozAttachmentsBucket({
    env: { SUPABASE_URL: "https://supabase.test", SUPABASE_SERVICE_ROLE_KEY: "secret" },
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      return responses.shift();
    },
  });

  assert.equal(result.bucket, TLOZ_ATTACHMENTS_BUCKET);
  assert.equal(result.public, false);
  assert.equal(result.file_size_limit, 6 * 1024 * 1024);
  assert.equal(requests[0].url, "https://supabase.test/storage/v1/bucket/tloz-attachments");
  assert.equal(requests[1].init.method, "POST");
  assert.equal(requests[2].init.method, "PUT");
  assert.deepEqual(JSON.parse(requests[1].init.body).allowed_mime_types, ["image/png", "image/jpeg", "image/webp"]);
});
