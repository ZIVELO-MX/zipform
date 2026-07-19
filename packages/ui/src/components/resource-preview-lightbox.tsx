"use client";

import Lightbox from "yet-another-react-lightbox";
import DownloadPlugin from "yet-another-react-lightbox/plugins/download";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import type { ResourcePreviewSlide } from "./resource-preview";

type ResourcePreviewLightboxProps = {
  slides: readonly ResourcePreviewSlide[];
  open: boolean;
  index: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  onExited: () => void;
};

export function ResourcePreviewLightbox({
  slides,
  open,
  index,
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
      plugins={[Zoom, Thumbnails, Fullscreen, DownloadPlugin]}
      zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true }}
      carousel={{
        finite: slides.length <= 1,
        preload: 2,
        imageFit: "contain",
      }}
      controller={{ aria: true }}
      labels={{
        Next: "Siguiente imagen",
        Previous: "Imagen anterior",
        Close: "Cerrar vista previa",
        "Zoom in": "Acercar",
        "Zoom out": "Alejar",
      }}
      on={{
        view: ({ index: currentIndex }) => onIndexChange?.(currentIndex),
        exited: onExited,
      }}
      className="tloz-resource-preview"
    />
  );
}
