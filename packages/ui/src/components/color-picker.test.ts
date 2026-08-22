import { describe, expect, it } from "vitest";
import { isHexColor, normalizeHexColor } from "./color-picker";

describe("ColorPicker", () => {
  it("normalizes pasted hexadecimal colors", () => {
    expect(normalizeHexColor("  #2d6cdf ")).toBe("#2D6CDF");
  });

  it("accepts only complete six-digit hexadecimal colors", () => {
    expect(isHexColor("#2d6cdf")).toBe(true);
    expect(isHexColor("#2D6CD")).toBe(false);
    expect(isHexColor("2D6CDF")).toBe(false);
    expect(isHexColor("#GG6CDF")).toBe(false);
  });
});
