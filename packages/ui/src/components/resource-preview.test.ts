import { describe, expect, it } from "vitest";
import { clampResourcePreviewIndex, normalizeResourcePreviewSlides } from "./resource-preview";

describe("ResourcePreview", () => {
  it("clamps the initial index to the available slide range", () => {
    expect(clampResourcePreviewIndex(-1, 2)).toBe(0);
    expect(clampResourcePreviewIndex(1, 2)).toBe(1);
    expect(clampResourcePreviewIndex(10, 2)).toBe(1);
    expect(clampResourcePreviewIndex(4, 0)).toBe(0);
  });

  it("normalizes empty sources and accessible alt text", () => {
    expect(normalizeResourcePreviewSlides([
      { id: "one", src: " /one.png ", alt: "  " },
      { id: "empty", src: "   ", alt: "Ignored" },
    ])).toEqual([{ id: "one", src: " /one.png ", alt: "Imagen" }]);
  });
});
