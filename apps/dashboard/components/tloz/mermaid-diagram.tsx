"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ResourcePreview } from "@zipform/ui";
import { createMermaidSvgBlob, getMermaidSvgDimensions } from "./mermaid-download";

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
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [previewSrc, setPreviewSrc] = useState<string>();

  useEffect(() => {
    const url = URL.createObjectURL(createMermaidSvgBlob(svg));
    setPreviewSrc(url);
    return () => {
      setPreviewSrc((current) => current === url ? undefined : current);
      URL.revokeObjectURL(url);
    };
  }, [svg]);

  const dimensions = getMermaidSvgDimensions(svg);
  const slide = previewSrc ? {
    id: "mermaid-diagram",
    src: previewSrc,
    alt: "Diagrama Mermaid",
    ...dimensions,
    ...(dimensions ? { srcSet: [{ src: previewSrc, ...dimensions }] } : {}),
  } : null;

  return (
    <>
      <figure className="group relative mb-3 overflow-x-auto rounded-xl border border-carbon/10 bg-paper p-3 last:mb-0" aria-label="Diagrama Mermaid">
        <button ref={triggerRef} type="button" className="block min-w-fit w-full cursor-zoom-in rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-zivelo" onClick={() => setOpen(true)} aria-label="Abrir diagrama Mermaid">
          <span className="block min-w-fit [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        </button>
        <figcaption className="sr-only">Haz clic en el diagrama para abrir la vista previa con zoom.</figcaption>
      </figure>
      {slide ? <ResourcePreview slides={[slide]} open={open} onClose={() => setOpen(false)} triggerRef={triggerRef} /> : null}
    </>
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
