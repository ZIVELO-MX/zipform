import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("combines conditional classes", () => {
    expect(cn("button", false && "hidden", { active: true })).toBe("button active");
  });

  it("resolves conflicting Tailwind utilities with the last value", () => {
    expect(cn("px-2 text-sm", "px-4 text-lg")).toBe("px-4 text-lg");
  });
});
