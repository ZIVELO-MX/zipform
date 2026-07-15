import { describe, expect, it } from "vitest";
import { createMermaidSvgBlob } from "./mermaid-download";

describe("Mermaid SVG download", () => {
  it("preserves the rendered SVG in an SVG download blob", async () => {
    const svg = '<svg viewBox="0 0 10 10"><text>Diagrama</text></svg>';
    const blob = createMermaidSvgBlob(svg);

    expect(blob.type).toBe("image/svg+xml;charset=utf-8");
    await expect(blob.text()).resolves.toBe(svg);
  });
});
