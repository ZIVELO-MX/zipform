import { describe, expect, it } from "vitest";
import { createMermaidSvgBlob, getMermaidSvgDimensions } from "./mermaid-download";

describe("Mermaid SVG download", () => {
  it("preserves the rendered SVG in an SVG download blob", async () => {
    const svg = '<svg viewBox="0 0 10 10"><text>Diagrama</text></svg>';
    const blob = createMermaidSvgBlob(svg);

    expect(blob.type).toBe("image/svg+xml;charset=utf-8");
    await expect(blob.text()).resolves.toBe(svg);
  });

  it("reads the viewBox dimensions used by the lightbox zoom", () => {
    expect(getMermaidSvgDimensions('<svg viewBox="0 0 1280.5 720"></svg>')).toEqual({
      width: 1280.5,
      height: 720,
    });
  });

  it("ignores missing or invalid viewBox dimensions", () => {
    expect(getMermaidSvgDimensions("<svg></svg>")).toBeUndefined();
    expect(getMermaidSvgDimensions('<svg viewBox="0 0 0 720"></svg>')).toBeUndefined();
  });
});
