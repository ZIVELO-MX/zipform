"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, cn } from "@tloz/ui";

export function HorizontalScrollArea({ children, label, className, viewportClassName }: {
  children: ReactNode;
  label: string;
  className?: string;
  viewportClassName?: string;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  function updateEdges() {
    const node = viewport.current;
    if (!node) return;
    const next = { left: node.scrollLeft > 1, right: node.scrollLeft + node.clientWidth < node.scrollWidth - 1 };
    setEdges((current) => current.left === next.left && current.right === next.right ? current : next);
  }

  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(node);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    updateEdges();
    return () => observer.disconnect();
  }, [children]);

  return <div className={cn("flex min-h-0 min-w-0 flex-col", className)}>
    {edges.left || edges.right ? <div className="mb-2 flex shrink-0 items-center justify-end gap-1 text-xs font-semibold text-carbon/65">
      <span className="mr-1">Más columnas</span>
      <Button variant="ghost" size="icon-xs" disabled={!edges.left} aria-label={`${label}: desplazar a la izquierda`} onClick={() => viewport.current?.scrollBy({ left: -Math.max(280, viewport.current.clientWidth * 0.75), behavior: "instant" })}><ChevronLeft aria-hidden="true" /></Button>
      <Button variant="ghost" size="icon-xs" disabled={!edges.right} aria-label={`${label}: desplazar a la derecha`} onClick={() => viewport.current?.scrollBy({ left: Math.max(280, viewport.current.clientWidth * 0.75), behavior: "instant" })}><ChevronRight aria-hidden="true" /></Button>
    </div> : null}
    <div ref={viewport} role="region" aria-label={label} tabIndex={0} onScroll={updateEdges} className={cn("min-h-0 min-w-0 overflow-auto overscroll-contain rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-zivelo", viewportClassName)}>{children}</div>
  </div>;
}
