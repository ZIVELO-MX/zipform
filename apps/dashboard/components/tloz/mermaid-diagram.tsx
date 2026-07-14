"use client";

import { useEffect, useId, useState } from "react";

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
    return (
      <figure className="mb-3 overflow-x-auto rounded-xl border border-carbon/10 bg-white p-3 last:mb-0" aria-label="Diagrama Mermaid" tabIndex={0}>
        <div className="min-w-fit [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: state.svg }} />
        <figcaption className="sr-only">Diagrama generado desde la descripción Markdown.</figcaption>
      </figure>
    );
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
