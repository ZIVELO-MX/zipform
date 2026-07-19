"use client";

import * as React from "react";

export type ResourcePreviewSlide = {
  id: string;
  src: string;
  alt: string;
  title?: string;
  width?: number;
  height?: number;
  srcSet?: Array<{ src: string; width: number; height: number }>;
};

export type ResourcePreviewProps = {
  slides: readonly ResourcePreviewSlide[];
  open: boolean;
  onClose: () => void;
  index?: number;
  onIndexChange?: (index: number) => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  ariaLabel?: string;
};

export function clampResourcePreviewIndex(index: number, slidesLength: number) {
  if (slidesLength <= 0) return 0;
  return Math.min(Math.max(index, 0), slidesLength - 1);
}
const LazyResourcePreviewLightbox = React.lazy(() =>
  import("./resource-preview-lightbox").then(({ ResourcePreviewLightbox }) => ({
    default: ResourcePreviewLightbox,
  })),
);

export function ResourcePreview({
  slides,
  open,
  onClose,
  index = 0,
  onIndexChange,
  triggerRef,
  ariaLabel = "Vista previa de recursos",
}: ResourcePreviewProps) {
  if (!open || slides.length === 0) return null;

  const safeIndex = clampResourcePreviewIndex(index, slides.length);

  return (
    <React.Suspense fallback={<div className="sr-only" role="status">Cargando vista previa…</div>}>
      <LazyResourcePreviewLightbox
        slides={slides}
        open={open}
        index={safeIndex}
        ariaLabel={ariaLabel}
        onClose={onClose}
        onIndexChange={onIndexChange}
        onExited={() => {
          triggerRef?.current?.focus();
        }}
      />
    </React.Suspense>
  );
}
