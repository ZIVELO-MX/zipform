import { scryptSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyPassword } from "./password";

describe("verifyPassword", () => {
  const salt = "0123456789abcdef0123456789abcdef";
  const stored = `${salt}:${scryptSync("changeme", salt, 64).toString("hex")}`;

  it("accepts the matching password", () => {
    expect(verifyPassword("changeme", stored)).toBe(true);
  });

  it("rejects invalid passwords and malformed hashes", () => {
    expect(verifyPassword("wrong", stored)).toBe(false);
    expect(verifyPassword("changeme", "invalid")).toBe(false);
  });
});
