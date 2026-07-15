import { describe, expect, it } from "vitest";
import {
  INITIAL_MERMAID_ZOOM,
  MAX_MERMAID_ZOOM,
  MERMAID_ZOOM_STEP,
  MIN_MERMAID_ZOOM,
  clampMermaidZoom,
  mermaidZoomFromWheel,
  normalizeWheelDelta,
  panMermaidViewBox,
  resolveMermaidViewBox,
  zoomMermaidViewBox,
} from "./mermaid-viewport";

describe("Mermaid diagram viewport", () => {
  it("opens at 150% and clamps button steps to the supported range", () => {
    expect(INITIAL_MERMAID_ZOOM).toBe(1.5);
    expect(MERMAID_ZOOM_STEP).toBe(0.25);
    expect(clampMermaidZoom(0.1)).toBe(MIN_MERMAID_ZOOM);
    expect(clampMermaidZoom(2)).toBe(2);
    expect(clampMermaidZoom(8)).toBe(MAX_MERMAID_ZOOM);
  });

  it("zooms in for wheel up and out for wheel down", () => {
    expect(mermaidZoomFromWheel(1.5, -100)).toBeGreaterThan(1.5);
    expect(mermaidZoomFromWheel(1.5, 100)).toBeLessThan(1.5);
  });

  it("normalizes wheel line and page deltas", () => {
    expect(normalizeWheelDelta(2, 0, 900)).toBe(2);
    expect(normalizeWheelDelta(2, 1, 900)).toBe(32);
    expect(normalizeWheelDelta(2, 2, 900)).toBe(1800);
  });

  it("zooms the viewBox around the point below the cursor", () => {
    const result = zoomMermaidViewBox(
      { x: 0, y: 0, width: 1_000, height: 500 },
      1,
      2,
      { x: 250, y: 125 },
    );

    expect(result).toEqual({ x: 125, y: 62.5, width: 500, height: 250 });
    expect((250 - result.x) / result.width).toBe(0.25);
    expect((125 - result.y) / result.height).toBe(0.25);
  });

  it("zooms from buttons around the current center", () => {
    const current = { x: 100, y: 50, width: 600, height: 300 };
    const result = zoomMermaidViewBox(current, 1.5, 1.75, { x: 400, y: 200 });

    expect(result.x + result.width / 2).toBeCloseTo(400);
    expect(result.y + result.height / 2).toBeCloseTo(200);
  });

  it("pans from pointer deltas without changing zoom", () => {
    const result = panMermaidViewBox(
      { x: 100, y: 50, width: 500, height: 250 },
      { x: 40, y: -20 },
      { x: 2, y: 2 },
    );

    expect(result).toEqual({ x: 80, y: 60, width: 500, height: 250 });
  });

  it("centers the original viewBox at the initial 150% zoom", () => {
    const original = { x: 0, y: 0, width: 900, height: 600 };
    const result = zoomMermaidViewBox(original, 1, INITIAL_MERMAID_ZOOM, { x: 450, y: 300 });

    expect(result).toEqual({ x: 150, y: 100, width: 600, height: 400 });
  });

  it("falls back to the SVG bounding box when viewBox is missing", () => {
    const bounds = { x: 12, y: 8, width: 640, height: 360 };

    expect(resolveMermaidViewBox(null, bounds)).toEqual(bounds);
    expect(resolveMermaidViewBox({ x: 0, y: 0, width: 0, height: 0 }, bounds)).toEqual(bounds);
    expect(resolveMermaidViewBox(null, null)).toBeNull();
  });
});
