"use client";

import { useEffect, useId, useState } from "react";
import { Download, X } from "lucide-react";
import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogTrigger } from "@zipform/ui";
import { createMermaidSvgBlob } from "./mermaid-download";

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

function downloadMermaidSvg(svg: string) {
  const url = URL.createObjectURL(createMermaidSvgBlob(svg));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "diagrama-mermaid.svg";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function MermaidViewer({ svg }: { svg: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <figure className="group relative mb-3 overflow-x-auto rounded-xl border border-carbon/10 bg-paper p-3 last:mb-0" aria-label="Diagrama Mermaid">
        {!open ? <div className="pointer-events-none min-w-fit [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} /> : null}
        <DialogTrigger asChild>
          <Button type="button" variant="ghost" className="absolute inset-0 hidden size-full cursor-pointer rounded-xl bg-transparent p-0 hover:bg-carbon/[0.025] focus-visible:outline-zivelo sm:flex" aria-label="Abrir diagrama Mermaid" />
        </DialogTrigger>
        <figcaption className="px-3 pt-2 text-xs font-semibold text-carbon/55 sm:sr-only">En móvil, usa el zoom nativo del navegador para ampliar el diagrama.</figcaption>
      </figure>

      <DialogContent
        title="Visor de diagrama Mermaid"
        overlayVariant="mission"
        className="flex h-dvh w-full max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 bg-paper p-0 shadow-[-12px_0_48px_rgba(29,29,27,0.16)] motion-reduce:animate-none sm:h-[calc(100dvh-2rem)] sm:w-[calc(100%-2rem)] sm:rounded-2xl sm:border sm:border-carbon/10"
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogDescription>Vista completa del diagrama Mermaid con descarga en formato SVG.</DialogDescription>
        <div className="flex shrink-0 items-center justify-end gap-2 border-b border-carbon/10 px-4 py-3 sm:px-5">
          <Button type="button" variant="outline" size="sm" onClick={() => downloadMermaidSvg(svg)} aria-label="Descargar diagrama SVG">
            <Download data-icon="inline-start" aria-hidden="true" />
            Descargar SVG
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="outline" size="icon" className="rounded-full" aria-label="Cerrar visor de diagrama">
              <X aria-hidden="true" />
            </Button>
          </DialogClose>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4 sm:p-6">
          <div className="size-full [&_svg]:block [&_svg]:size-full [&_svg]:!max-w-none" dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
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
