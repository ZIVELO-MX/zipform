import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashApiKey(key: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(key, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyApiKey(plain: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  if (!expected.length) return false;

  const actual = scryptSync(plain, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function generateApiKey(): string {
  return `zaf_${randomBytes(32).toString("hex")}`;
}
