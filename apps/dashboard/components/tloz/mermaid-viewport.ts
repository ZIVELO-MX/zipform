export const MIN_MERMAID_ZOOM = 0.5;
export const MAX_MERMAID_ZOOM = 4;
export const MERMAID_ZOOM_STEP = 0.25;

export type MermaidViewportTransform = {
  scale: number;
  x: number;
  y: number;
};

export type MermaidViewportPoint = {
  x: number;
  y: number;
};

export const DEFAULT_MERMAID_TRANSFORM: MermaidViewportTransform = {
  scale: 1,
  x: 0,
  y: 0,
};

export function clampMermaidZoom(scale: number) {
  return Math.min(MAX_MERMAID_ZOOM, Math.max(MIN_MERMAID_ZOOM, scale));
}

export function zoomMermaidAt(
  transform: MermaidViewportTransform,
  requestedScale: number,
  point: MermaidViewportPoint,
): MermaidViewportTransform {
  const scale = clampMermaidZoom(requestedScale);
  const ratio = scale / transform.scale;

  return {
    scale,
    x: point.x - (point.x - transform.x) * ratio,
    y: point.y - (point.y - transform.y) * ratio,
  };
}

export function panMermaid(
  transform: MermaidViewportTransform,
  delta: MermaidViewportPoint,
): MermaidViewportTransform {
  return {
    ...transform,
    x: transform.x + delta.x,
    y: transform.y + delta.y,
  };
}
