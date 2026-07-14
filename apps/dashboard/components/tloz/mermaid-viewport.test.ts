import { describe, expect, it } from "vitest";
import {
  DEFAULT_MERMAID_TRANSFORM,
  MAX_MERMAID_ZOOM,
  MIN_MERMAID_ZOOM,
  clampMermaidZoom,
  panMermaid,
  zoomMermaidAt,
} from "./mermaid-viewport";

describe("Mermaid diagram viewport", () => {
  it("clamps zoom to the supported range", () => {
    expect(clampMermaidZoom(0.1)).toBe(MIN_MERMAID_ZOOM);
    expect(clampMermaidZoom(2)).toBe(2);
    expect(clampMermaidZoom(8)).toBe(MAX_MERMAID_ZOOM);
  });

  it("keeps the pointer anchor stable while zooming", () => {
    const point = { x: 120, y: -40 };
    const result = zoomMermaidAt(DEFAULT_MERMAID_TRANSFORM, 2, point);

    expect(result).toEqual({ scale: 2, x: -120, y: 40 });
    expect((point.x - result.x) / result.scale).toBe(point.x);
    expect((point.y - result.y) / result.scale).toBe(point.y);
  });

  it("pans without changing the current scale", () => {
    expect(panMermaid({ scale: 1.5, x: 10, y: -5 }, { x: 8, y: 12 })).toEqual({
      scale: 1.5,
      x: 18,
      y: 7,
    });
  });
});
