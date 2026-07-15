export const MIN_MERMAID_ZOOM = 0.5;
export const MAX_MERMAID_ZOOM = 4;
export const INITIAL_MERMAID_ZOOM = 1.5;

const WHEEL_ZOOM_SENSITIVITY = 0.0015;

export type MermaidViewportPoint = {
  x: number;
  y: number;
};

export type MermaidViewportRect = MermaidViewportPoint & {
  width: number;
  height: number;
};

export function clampMermaidZoom(scale: number) {
  return Math.min(MAX_MERMAID_ZOOM, Math.max(MIN_MERMAID_ZOOM, scale));
}

export function mermaidZoomFromWheel(scale: number, pixelDeltaY: number) {
  return clampMermaidZoom(scale * Math.exp(-pixelDeltaY * WHEEL_ZOOM_SENSITIVITY));
}

export function normalizeWheelDelta(deltaY: number, deltaMode: number, viewportHeight: number) {
  if (deltaMode === 1) return deltaY * 16;
  if (deltaMode === 2) return deltaY * viewportHeight;
  return deltaY;
}

export function mermaidAnchorInRect(rect: MermaidViewportRect, point: MermaidViewportPoint) {
  return {
    x: rect.width === 0 ? 0.5 : (point.x - rect.x) / rect.width,
    y: rect.height === 0 ? 0.5 : (point.y - rect.y) / rect.height,
  };
}

export function mermaidScrollCorrection(
  rect: MermaidViewportRect,
  anchor: MermaidViewportPoint,
  point: MermaidViewportPoint,
) {
  return {
    x: rect.x + rect.width * anchor.x - point.x,
    y: rect.y + rect.height * anchor.y - point.y,
  };
}
