"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { X } from "lucide-react";
import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogTrigger } from "@zipform/ui";
import {
  INITIAL_MERMAID_ZOOM,
  mermaidAnchorInRect,
  mermaidScrollCorrection,
  mermaidZoomFromWheel,
  normalizeWheelDelta,
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

function MermaidViewer({ svg }: { svg: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const baseWidthRef = useRef(0);
  const zoomRef = useRef(INITIAL_MERMAID_ZOOM);
  const dragRef = useRef<{ pointerId: number; scrollLeft: number; scrollTop: number; x: number; y: number } | null>(null);
  const wheelRef = useRef<{ delta: number; x: number; y: number } | null>(null);
  const initFrameRef = useRef<number | null>(null);
  const wheelFrameRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(INITIAL_MERMAID_ZOOM);

  useLayoutEffect(() => {
    if (!open) return;
    const stage = stageRef.current;
    const diagram = diagramRef.current;
    if (!stage || !diagram) return;

    baseWidthRef.current = Math.max(stage.clientWidth - 64, 320);
    zoomRef.current = INITIAL_MERMAID_ZOOM;
    diagram.style.width = `${baseWidthRef.current * INITIAL_MERMAID_ZOOM}px`;
    setZoom(INITIAL_MERMAID_ZOOM);

    initFrameRef.current = window.requestAnimationFrame(() => {
      initFrameRef.current = null;
      stage.scrollLeft = Math.max(0, (stage.scrollWidth - stage.clientWidth) / 2);
      stage.scrollTop = Math.max(0, (stage.scrollHeight - stage.clientHeight) / 2);
    });

    return () => {
      if (initFrameRef.current !== null) window.cancelAnimationFrame(initFrameRef.current);
      initFrameRef.current = null;
    };
  }, [open, svg]);

  useEffect(() => {
    if (!open) return;
    const stage = stageRef.current;
    if (!stage) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = normalizeWheelDelta(event.deltaY, event.deltaMode, stage.clientHeight);
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
        const diagram = diagramRef.current;
        wheelRef.current = null;
        if (!wheel || !diagram) return;

        const previousRect = diagram.getBoundingClientRect();
        const pointer = { x: wheel.x, y: wheel.y };
        const anchor = mermaidAnchorInRect({
          x: previousRect.left,
          y: previousRect.top,
          width: previousRect.width,
          height: previousRect.height,
        }, pointer);
        const nextZoom = mermaidZoomFromWheel(zoomRef.current, wheel.delta);
        if (nextZoom === zoomRef.current) return;

        zoomRef.current = nextZoom;
        diagram.style.width = `${baseWidthRef.current * nextZoom}px`;
        const nextRect = diagram.getBoundingClientRect();
        const correction = mermaidScrollCorrection({
          x: nextRect.left,
          y: nextRect.top,
          width: nextRect.width,
          height: nextRect.height,
        }, anchor, pointer);
        stage.scrollLeft += correction.x;
        stage.scrollTop += correction.y;
        setZoom(nextZoom);
      });
    };

    stage.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      stage.removeEventListener("wheel", handleWheel);
      if (wheelFrameRef.current !== null) window.cancelAnimationFrame(wheelFrameRef.current);
      wheelFrameRef.current = null;
      wheelRef.current = null;
    };
  }, [open]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const stage = event.currentTarget;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.dragging = "true";
    dragRef.current = {
      pointerId: event.pointerId,
      scrollLeft: stage.scrollLeft,
      scrollTop: stage.scrollTop,
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.currentTarget.scrollLeft = drag.scrollLeft - (event.clientX - drag.x);
    event.currentTarget.scrollTop = drag.scrollTop - (event.clientY - drag.y);
  };

  const stopDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    delete event.currentTarget.dataset.dragging;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) dragRef.current = null;
      setOpen(nextOpen);
    }}>
      <figure className="group relative mb-3 overflow-x-auto rounded-xl border border-carbon/10 bg-paper p-3 last:mb-0" aria-label="Diagrama Mermaid">
        <div className="pointer-events-none min-w-fit [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        <DialogTrigger asChild>
          <Button type="button" variant="ghost" className="absolute inset-0 size-full cursor-pointer rounded-xl bg-transparent p-0 hover:bg-carbon/[0.025] focus-visible:outline-zivelo" aria-label="Abrir diagrama Mermaid" />
        </DialogTrigger>
        <figcaption className="sr-only">Diagrama generado desde la descripción Markdown. Presiona para ampliarlo.</figcaption>
      </figure>

      <DialogContent
        title="Visor de diagrama Mermaid"
        overlayVariant="clear"
        className="h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-none gap-0 overflow-hidden rounded-2xl border-carbon/10 bg-ivory p-0 shadow-soft motion-reduce:animate-none"
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogDescription>Arrastra el diagrama para moverlo y usa la rueda para cambiar el zoom.</DialogDescription>
        <div
          ref={stageRef}
          className="size-full cursor-grab touch-none select-none overflow-hidden bg-ivory data-[dragging=true]:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
        >
          <div className="flex min-h-full min-w-full p-8">
            <div
              ref={diagramRef}
              className="pointer-events-none m-auto shrink-0 rounded-xl bg-paper p-4 shadow-[0_0_0_1px_rgba(29,29,27,0.08)] [&_svg]:block [&_svg]:h-auto [&_svg]:!max-w-none [&_svg]:!w-full"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        </div>

        <span className="pointer-events-none absolute bottom-4 left-1/2 min-w-16 -translate-x-1/2 select-none rounded-lg border border-carbon/10 bg-paper px-3 py-2 text-center text-xs font-semibold tabular-nums text-carbon/65 shadow-soft">
          {Math.round(zoom * 100)}%
        </span>

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
