"use client";

import { useCallback, useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Maximize2, Minus, Plus, X } from "lucide-react";
import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogTrigger } from "@zipform/ui";
import {
  DEFAULT_MERMAID_TRANSFORM,
  MAX_MERMAID_ZOOM,
  MERMAID_ZOOM_STEP,
  MIN_MERMAID_ZOOM,
  panMermaid,
  zoomMermaidAt,
  type MermaidViewportTransform,
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
  const transformNodeRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<MermaidViewportTransform>({ ...DEFAULT_MERMAID_TRANSFORM });
  const dragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const frameRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(DEFAULT_MERMAID_TRANSFORM.scale);

  const renderTransform = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      const node = transformNodeRef.current;
      if (!node) return;
      const transform = transformRef.current;
      node.style.transform = `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`;
    });
  }, []);

  const resetTransform = useCallback(() => {
    transformRef.current = { ...DEFAULT_MERMAID_TRANSFORM };
    setScale(DEFAULT_MERMAID_TRANSFORM.scale);
    renderTransform();
  }, [renderTransform]);

  const updateZoom = useCallback((requestedScale: number, clientX?: number, clientY?: number) => {
    const stage = stageRef.current;
    let point = { x: 0, y: 0 };
    if (stage && clientX !== undefined && clientY !== undefined) {
      const rect = stage.getBoundingClientRect();
      point = {
        x: clientX - rect.left - rect.width / 2,
        y: clientY - rect.top - rect.height / 2,
      };
    }
    transformRef.current = zoomMermaidAt(transformRef.current, requestedScale, point);
    setScale(transformRef.current.scale);
    renderTransform();
  }, [renderTransform]);

  useEffect(() => {
    if (!open) return;
    const stage = stageRef.current;
    if (!stage) return;

    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const direction = event.deltaY > 0 ? -1 : 1;
      updateZoom(transformRef.current.scale + direction * MERMAID_ZOOM_STEP, event.clientX, event.clientY);
    };

    stage.addEventListener("wheel", handleWheel, { passive: false });
    return () => stage.removeEventListener("wheel", handleWheel);
  }, [open, updateZoom]);

  useEffect(() => () => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.dragging = "true";
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    transformRef.current = panMermaid(transformRef.current, {
      x: event.clientX - drag.x,
      y: event.clientY - drag.y,
    });
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    renderTransform();
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
      if (nextOpen) resetTransform();
      else dragRef.current = null;
      setOpen(nextOpen);
    }}>
      <figure className="group relative mb-3 overflow-x-auto rounded-xl border border-carbon/10 bg-paper p-3 last:mb-0" aria-label="Diagrama Mermaid">
        <div className="min-w-fit pointer-events-none [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        <DialogTrigger asChild>
          <Button type="button" variant="ghost" className="absolute inset-0 size-full cursor-zoom-in rounded-xl bg-transparent p-0 hover:bg-carbon/[0.025] focus-visible:outline-zivelo" aria-label="Ampliar diagrama Mermaid">
            <span className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-lg border border-carbon/10 bg-paper/95 text-carbon/60 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <Maximize2 aria-hidden="true" />
            </span>
          </Button>
        </DialogTrigger>
        <figcaption className="sr-only">Diagrama generado desde la descripción Markdown. Presiona para ampliarlo.</figcaption>
      </figure>

      <DialogContent
        title="Visor de diagrama Mermaid"
        className="h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-none gap-0 overflow-hidden rounded-2xl border-white/10 bg-carbon p-0 shadow-none motion-reduce:animate-none"
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogDescription>Arrastra el diagrama para moverlo. Usa los controles o Control más rueda para cambiar el zoom.</DialogDescription>
        <div
          ref={stageRef}
          className="flex size-full cursor-grab touch-none select-none items-center justify-center overflow-hidden p-6 data-[dragging=true]:cursor-grabbing sm:p-10"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
        >
          <div
            ref={transformNodeRef}
            className="pointer-events-none inline-flex max-h-full max-w-full will-change-transform rounded-xl bg-paper p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] [&_svg]:h-auto [&_svg]:max-h-[calc(100dvh-8rem)] [&_svg]:max-w-[calc(100vw-4rem)]"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>

        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-carbon/10 bg-paper p-1 shadow-soft">
          <Button type="button" variant="ghost" size="icon" aria-label="Reducir diagrama" disabled={scale <= MIN_MERMAID_ZOOM} onClick={() => updateZoom(scale - MERMAID_ZOOM_STEP)}>
            <Minus aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="min-w-16 tabular-nums" aria-label="Restablecer zoom y posición" onClick={resetTransform}>
            {Math.round(scale * 100)}%
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Ampliar diagrama" disabled={scale >= MAX_MERMAID_ZOOM} onClick={() => updateZoom(scale + MERMAID_ZOOM_STEP)}>
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
