import { describe, expect, it } from "vitest";
import {
  INITIAL_MERMAID_ZOOM,
  MAX_MERMAID_ZOOM,
  MIN_MERMAID_ZOOM,
  clampMermaidZoom,
  mermaidAnchorInRect,
  mermaidScrollCorrection,
  mermaidZoomFromWheel,
  normalizeWheelDelta,
} from "./mermaid-viewport";

describe("Mermaid diagram viewport", () => {
  it("opens at 150% and clamps zoom to the supported range", () => {
    expect(INITIAL_MERMAID_ZOOM).toBe(1.5);
    expect(clampMermaidZoom(0.1)).toBe(MIN_MERMAID_ZOOM);
    expect(clampMermaidZoom(2)).toBe(2);
    expect(clampMermaidZoom(8)).toBe(MAX_MERMAID_ZOOM);
  });

  it("zooms directly from wheel movement", () => {
    expect(mermaidZoomFromWheel(1.5, -100)).toBeGreaterThan(1.5);
    expect(mermaidZoomFromWheel(1.5, 100)).toBeLessThan(1.5);
  });

  it("normalizes wheel line and page deltas", () => {
    expect(normalizeWheelDelta(2, 0, 900)).toBe(2);
    expect(normalizeWheelDelta(2, 1, 900)).toBe(32);
    expect(normalizeWheelDelta(2, 2, 900)).toBe(1800);
  });

  it("preserves the point below the cursor after resizing", () => {
    const pointer = { x: 400, y: 260 };
    const anchor = mermaidAnchorInRect({ x: 100, y: 60, width: 600, height: 400 }, pointer);
    const correction = mermaidScrollCorrection({ x: 40, y: 20, width: 1200, height: 800 }, anchor, pointer);

    expect(anchor).toEqual({ x: 0.5, y: 0.5 });
    expect(correction).toEqual({ x: 240, y: 160 });
  });
});
