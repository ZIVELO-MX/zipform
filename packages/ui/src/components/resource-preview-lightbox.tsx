"use client";

import Lightbox from "yet-another-react-lightbox";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import type { ResourcePreviewSlide } from "./resource-preview";

type ResourcePreviewLightboxProps = {
  slides: readonly ResourcePreviewSlide[];
  open: boolean;
  index: number;
  ariaLabel: string;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  onExited: () => void;
};

export function ResourcePreviewLightbox({
  slides,
  open,
  index,
  ariaLabel,
  onClose,
  onIndexChange,
  onExited,
}: ResourcePreviewLightboxProps) {
  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={slides.map(({ id: _id, title: _title, ...slide }) => slide)}
      plugins={[Zoom, Thumbnails, Fullscreen]}
      carousel={{
        finite: slides.length <= 1,
        preload: 2,
        imageFit: "contain",
        imageProps: { loading: "lazy", decoding: "async" },
      }}
      controller={{ aria: true }}
      labels={{
        Next: "Siguiente imagen",
        Previous: "Imagen anterior",
        Close: "Cerrar vista previa",
        ZoomIn: "Acercar",
        ZoomOut: "Alejar",
      }}
      on={{
        view: ({ index: currentIndex }) => onIndexChange?.(currentIndex),
        exited: onExited,
      }}
      className="tloz-resource-preview"
      render={{
        slide: ({ slide, offset, rect }) => {
          const imageSlide = slide as typeof slide & { alt?: string; src?: string };
          if (!imageSlide.src) return null;
          return (
            <img
              src={imageSlide.src}
              alt={imageSlide.alt ?? ariaLabel}
              width={imageSlide.width}
              height={imageSlide.height}
              srcSet={imageSlide.srcSet?.map((entry) => `${entry.src} ${entry.width}w`).join(", ")}
              sizes={`${Math.round(rect.width)}px`}
              loading={offset === 0 ? "eager" : "lazy"}
              fetchPriority={offset === 0 ? "high" : "low"}
              decoding="async"
              className="max-h-full max-w-full object-contain"
            />
          );
        },
      }}
    />
  );
}
