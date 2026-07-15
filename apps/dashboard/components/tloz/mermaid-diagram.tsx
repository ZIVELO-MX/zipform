"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";
import { Minus, Plus, X } from "lucide-react";
import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogTrigger } from "@zipform/ui";
import {
  INITIAL_MERMAID_ZOOM,
  MAX_MERMAID_ZOOM,
  MERMAID_ZOOM_STEP,
  MIN_MERMAID_ZOOM,
  clampMermaidZoom,
  type MermaidViewBox,
  type MermaidViewportPoint,
  mermaidZoomFromWheel,
  normalizeWheelDelta,
  panMermaidViewBox,
  resolveMermaidViewBox,
  zoomMermaidViewBox,
} from "./mermaid-viewport";

type MermaidState =
  | { status: "loading" }
  | { status: "ready"; svg: string }
  | { status: "invalid" };

let mermaidLoader: Promise<(typeof import("mermaid"))["default"]> | undefined;

function loadMermaid() {
  mermaidLoader ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      suppressErrorRendering: true,
      maxTextSize: 20_000,
      maxEdges: 500,
    });
    return mermaid;
  });
  return mermaidLoader;
}

function readSvgViewBox(svgElement: SVGSVGElement) {
  const viewBox = svgElement.viewBox.baseVal;
  return resolveMermaidViewBox({
    x: viewBox.x,
    y: viewBox.y,
    width: viewBox.width,
    height: viewBox.height,
  }, null);
}

function svgPointFromClient(svgElement: SVGSVGElement, viewBox: MermaidViewBox, clientX: number, clientY: number) {
  const rect = svgElement.getBoundingClientRect();
  const scale = Math.min(rect.width / viewBox.width, rect.height / viewBox.height);
  if (!Number.isFinite(scale) || scale <= 0) return null;
  const renderedWidth = viewBox.width * scale;
  const renderedHeight = viewBox.height * scale;
  const left = rect.left + (rect.width - renderedWidth) / 2;
  const top = rect.top + (rect.height - renderedHeight) / 2;

  return {
    x: viewBox.x + (clientX - left) / scale,
    y: viewBox.y + (clientY - top) / scale,
  };
}

function svgScreenScale(svgElement: SVGSVGElement, viewBox: MermaidViewBox) {
  const rect = svgElement.getBoundingClientRect();
  const scale = Math.min(rect.width / viewBox.width, rect.height / viewBox.height);
  return { x: scale, y: scale };
}

function MermaidViewer({ svg }: { svg: string }) {
  const diagramRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(INITIAL_MERMAID_ZOOM);
  const dragRef = useRef<{
    pointerId: number;
    startViewBox: MermaidViewBox;
    screenScale: MermaidViewportPoint;
    x: number;
    y: number;
  } | null>(null);
  const wheelRef = useRef<{ delta: number; x: number; y: number } | null>(null);
  const wheelFrameRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(INITIAL_MERMAID_ZOOM);

  const applyViewBox = useCallback((nextViewBox: MermaidViewBox) => {
    const svgElement = diagramRef.current?.querySelector("svg");
    if (!svgElement) return;
    svgElement.setAttribute("viewBox", `${nextViewBox.x} ${nextViewBox.y} ${nextViewBox.width} ${nextViewBox.height}`);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const diagram = diagramRef.current;
    if (!diagram) return;

    const svgElement = diagram.querySelector("svg");
    if (!svgElement) return;
    const declared = svgElement.viewBox.baseVal;
    const declaredViewBox = svgElement.hasAttribute("viewBox")
      ? { x: declared.x, y: declared.y, width: declared.width, height: declared.height }
      : null;
    const bounds = declaredViewBox && declaredViewBox.width > 0 && declaredViewBox.height > 0
      ? null
      : svgElement.getBBox();
    const originalViewBox = resolveMermaidViewBox(declaredViewBox, bounds && {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    });
    if (!originalViewBox) return;

    svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");
    zoomRef.current = INITIAL_MERMAID_ZOOM;
    const center = {
      x: originalViewBox.x + originalViewBox.width / 2,
      y: originalViewBox.y + originalViewBox.height / 2,
    };
    applyViewBox(zoomMermaidViewBox(originalViewBox, 1, INITIAL_MERMAID_ZOOM, center));
    setZoom(INITIAL_MERMAID_ZOOM);
  }, [applyViewBox, open, svg]);

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = normalizeWheelDelta(event.deltaY, event.deltaMode, event.currentTarget.clientHeight);
    if (wheelRef.current) {
      wheelRef.current.delta += delta;
      wheelRef.current.x = event.clientX;
      wheelRef.current.y = event.clientY;
    } else {
      wheelRef.current = { delta, x: event.clientX, y: event.clientY };
    }

    if (wheelFrameRef.current !== null) return;
    wheelFrameRef.current = window.requestAnimationFrame(() => {
      wheelFrameRef.current = null;
      const wheel = wheelRef.current;
      const svgElement = diagramRef.current?.querySelector("svg");
      wheelRef.current = null;
      if (!wheel || !svgElement) return;
      const currentViewBox = readSvgViewBox(svgElement);
      if (!currentViewBox) return;

      const nextZoom = mermaidZoomFromWheel(zoomRef.current, wheel.delta);
      if (nextZoom === zoomRef.current) return;

      const anchor = svgPointFromClient(svgElement, currentViewBox, wheel.x, wheel.y);
      if (!anchor) return;
      applyViewBox(zoomMermaidViewBox(currentViewBox, zoomRef.current, nextZoom, anchor));
      zoomRef.current = nextZoom;
      setZoom(nextZoom);
    });
  };

  useEffect(() => () => {
    if (wheelFrameRef.current !== null) window.cancelAnimationFrame(wheelFrameRef.current);
    wheelFrameRef.current = null;
    wheelRef.current = null;
  }, [open]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const stage = event.currentTarget;
    const svgElement = diagramRef.current?.querySelector("svg");
    const currentViewBox = svgElement ? readSvgViewBox(svgElement) : null;
    if (!currentViewBox || !svgElement) return;
    stage.setPointerCapture(event.pointerId);
    stage.dataset.dragging = "true";
    dragRef.current = {
      pointerId: event.pointerId,
      startViewBox: currentViewBox,
      screenScale: svgScreenScale(svgElement, currentViewBox),
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    applyViewBox(panMermaidViewBox(
      drag.startViewBox,
      { x: event.clientX - drag.x, y: event.clientY - drag.y },
      drag.screenScale,
    ));
  };

  const stopDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    delete event.currentTarget.dataset.dragging;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const changeZoom = (step: number) => {
    const svgElement = diagramRef.current?.querySelector("svg");
    const currentViewBox = svgElement ? readSvgViewBox(svgElement) : null;
    if (!currentViewBox) return;
    const nextZoom = clampMermaidZoom(zoomRef.current + step);
    if (nextZoom === zoomRef.current) return;
    const center = {
      x: currentViewBox.x + currentViewBox.width / 2,
      y: currentViewBox.y + currentViewBox.height / 2,
    };
    applyViewBox(zoomMermaidViewBox(currentViewBox, zoomRef.current, nextZoom, center));
    zoomRef.current = nextZoom;
    setZoom(nextZoom);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) dragRef.current = null;
      setOpen(nextOpen);
    }}>
      <figure className="group relative mb-3 overflow-x-auto rounded-xl border border-carbon/10 bg-paper p-3 last:mb-0" aria-label="Diagrama Mermaid">
        {!open ? <div className="pointer-events-none min-w-fit [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} /> : null}
        <DialogTrigger asChild>
          <Button type="button" variant="ghost" className="absolute inset-0 size-full cursor-pointer rounded-xl bg-transparent p-0 hover:bg-carbon/[0.025] focus-visible:outline-zivelo" aria-label="Abrir diagrama Mermaid" />
        </DialogTrigger>
        <figcaption className="sr-only">Diagrama generado desde la descripción Markdown. Presiona para ampliarlo.</figcaption>
      </figure>

      <DialogContent
        title="Visor de diagrama Mermaid"
        overlayVariant="mission"
        className="h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-none gap-0 overflow-hidden rounded-2xl border-carbon/10 bg-paper p-0 shadow-[-12px_0_48px_rgba(29,29,27,0.16)] motion-reduce:animate-none"
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogDescription>Arrastra el diagrama para moverlo y usa la rueda para cambiar el zoom.</DialogDescription>
        <div
          className="size-full cursor-grab touch-none select-none overflow-hidden bg-paper data-[dragging=true]:cursor-grabbing"
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
        >
          <div
            ref={diagramRef}
            className="pointer-events-none size-full [&_svg]:block [&_svg]:size-full [&_svg]:!max-w-none"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>

        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-carbon/10 bg-paper p-1 shadow-soft">
          <Button type="button" variant="ghost" size="icon" className="rounded-lg" aria-label="Reducir diagrama" disabled={zoom <= MIN_MERMAID_ZOOM} onClick={() => changeZoom(-MERMAID_ZOOM_STEP)}>
            <Minus aria-hidden="true" />
          </Button>
          <span className="pointer-events-none min-w-14 select-none text-center text-xs font-semibold tabular-nums text-carbon/65">
            {Math.round(zoom * 100)}%
          </span>
          <Button type="button" variant="ghost" size="icon" className="rounded-lg" aria-label="Ampliar diagrama" disabled={zoom >= MAX_MERMAID_ZOOM} onClick={() => changeZoom(MERMAID_ZOOM_STEP)}>
            <Plus aria-hidden="true" />
          </Button>
        </div>

        <DialogClose asChild>
          <Button type="button" variant="outline" size="icon" className="absolute right-4 top-4 rounded-full" aria-label="Cerrar visor de diagrama">
            <X aria-hidden="true" />
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

export function MermaidDiagram({ source }: { source: string }) {
  const reactId = useId();
  const [state, setState] = useState<MermaidState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    const renderId = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
    setState({ status: "loading" });

    void loadMermaid()
      .then((mermaid) => mermaid.render(renderId, source))
      .then(({ svg }) => {
        if (active) setState({ status: "ready", svg });
      })
      .catch(() => {
        if (active) setState({ status: "invalid" });
      });

    return () => {
      active = false;
    };
  }, [reactId, source]);

  if (state.status === "ready") {
    return <MermaidViewer svg={state.svg} />;
  }

  if (state.status === "invalid") {
    return (
      <figure className="mb-3 overflow-hidden rounded-xl border border-[#D72228]/20 bg-[#FDECEC]/55 last:mb-0">
        <figcaption className="px-3 py-2 text-xs font-bold text-[#B91C22]">Diagrama Mermaid inválido</figcaption>
        <pre className="m-0 overflow-x-auto border-t border-[#D72228]/10 bg-white/70 p-3 text-[13px]" tabIndex={0}><code>{source}</code></pre>
      </figure>
    );
  }

  return <div className="mb-3 min-h-20 animate-pulse rounded-xl bg-carbon/5 last:mb-0" role="status"><span className="sr-only">Generando diagrama Mermaid…</span></div>;
}
