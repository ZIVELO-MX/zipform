import { scryptSync, timingSafeEqual } from "node:crypto";

export function verifyPassword(plain: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  if (!expected.length) return false;

  const actual = scryptSync(plain, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
