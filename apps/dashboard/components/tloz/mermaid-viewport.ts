export const MIN_MERMAID_ZOOM = 0.5;
export const MAX_MERMAID_ZOOM = 4;
export const INITIAL_MERMAID_ZOOM = 1.5;
export const MERMAID_ZOOM_STEP = 0.25;

const WHEEL_ZOOM_SENSITIVITY = 0.0015;

export type MermaidViewportPoint = {
  x: number;
  y: number;
};

export type MermaidViewBox = MermaidViewportPoint & {
  width: number;
  height: number;
};

function isUsableViewBox(viewBox: MermaidViewBox | null | undefined): viewBox is MermaidViewBox {
  return Boolean(viewBox && Number.isFinite(viewBox.x) && Number.isFinite(viewBox.y)
    && Number.isFinite(viewBox.width) && viewBox.width > 0
    && Number.isFinite(viewBox.height) && viewBox.height > 0);
}

export function resolveMermaidViewBox(
  declaredViewBox: MermaidViewBox | null | undefined,
  boundingBox: MermaidViewBox | null | undefined,
) {
  if (isUsableViewBox(declaredViewBox)) return declaredViewBox;
  if (isUsableViewBox(boundingBox)) return boundingBox;
  return null;
}

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

export function zoomMermaidViewBox(
  viewBox: MermaidViewBox,
  previousZoom: number,
  nextZoom: number,
  anchor: MermaidViewportPoint,
) {
  const ratio = previousZoom / nextZoom;
  const width = viewBox.width * ratio;
  const height = viewBox.height * ratio;

  return {
    x: anchor.x - (anchor.x - viewBox.x) * ratio,
    y: anchor.y - (anchor.y - viewBox.y) * ratio,
    width,
    height,
  };
}

export function panMermaidViewBox(
  viewBox: MermaidViewBox,
  pointerDelta: MermaidViewportPoint,
  screenScale: MermaidViewportPoint,
) {
  return {
    ...viewBox,
    x: viewBox.x - pointerDelta.x / screenScale.x,
    y: viewBox.y - pointerDelta.y / screenScale.y,
  };
}
