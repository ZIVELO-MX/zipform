import { describe, expect, it } from "vitest";
import { generateApiKey, hashApiKey, verifyApiKey } from "./crypto";

describe("TLOZ API keys", () => {
  it("generates the canonical prefix and still verifies legacy keys", () => {
    expect(generateApiKey()).toMatch(/^tloz_[0-9a-f]{64}$/);

    const legacy = "zaf_existing_key";
    const stored = hashApiKey(legacy);
    expect(verifyApiKey(legacy, stored)).toBe(true);
    expect(verifyApiKey("tloz_wrong_key", stored)).toBe(false);
  });
});
