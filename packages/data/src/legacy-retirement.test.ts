import { describe, expect, it } from "vitest";
import {
  LEGACY_RETIREMENT_TABLES,
  LegacyRetirementError,
  parseRetirementArgs,
  retirementDropStatements,
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
});
