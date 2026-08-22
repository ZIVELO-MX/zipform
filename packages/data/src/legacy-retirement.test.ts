import { describe, expect, it } from "vitest";
import {
  LEGACY_RETIREMENT_TABLES,
  LegacyRetirementError,
  parseRetirementArgs,
  retirementDropStatements,
  assertStableCanonicalWindow,
} from "./legacy-retirement";

describe("legacy retirement guards", () => {
  it("requires every independent evidence flag before validation or execution", () => {
    expect(() => parseRetirementArgs(["--confirm"])).toThrowError(LegacyRetirementError);
    try {
      parseRetirementArgs(["--confirm"]);
    } catch (error) {
      expect(error).toMatchObject({
        code: "retirement_requires_evidence",
        details: { missing: ["--legacy-traffic-zero", "--backup-verified"] },
      });
    }
  });

  it("keeps execution opt-in after all evidence flags are present", () => {
    expect(parseRetirementArgs(["--confirm", "--legacy-traffic-zero", "--backup-verified"]).execute).toBe(false);
    expect(parseRetirementArgs(["--confirm", "--legacy-traffic-zero", "--backup-verified", "--execute"]).execute).toBe(true);
  });

  it("drops only the documented EAV tables in dependency-safe order", () => {
    expect(retirementDropStatements()).toEqual(LEGACY_RETIREMENT_TABLES.map((table) => `DROP TABLE "${table}"`));
    expect(new Set(LEGACY_RETIREMENT_TABLES).size).toBe(LEGACY_RETIREMENT_TABLES.length);
  });

  it("requires seven real days of canonical observations without legacy traffic", () => {
    const state = { source: "canonical" as const, writesEnabled: true, reason: "enabled", version: 3, updatedAt: "2026-08-01T00:00:00.000Z" };
    const canonical = [{ source: "canonical", operation: "read", count: 12, lastAt: "2026-08-08T00:00:00.000Z" }];
    expect(() => assertStableCanonicalWindow(state, canonical, new Date("2026-08-08T00:00:00.000Z"))).not.toThrow();
    expect(() => assertStableCanonicalWindow(state, canonical, new Date("2026-08-07T23:59:59.000Z"))).toThrowError(LegacyRetirementError);
    expect(() => assertStableCanonicalWindow(state, [...canonical, { source: "legacy", operation: "read", count: 1, lastAt: "2026-08-05T00:00:00.000Z" }], new Date("2026-08-09T00:00:00.000Z"))).toThrowError(LegacyRetirementError);
  });
});
