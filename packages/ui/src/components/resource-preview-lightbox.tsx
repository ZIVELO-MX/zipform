"use client";

import Lightbox from "yet-another-react-lightbox";
import { ChevronLeft, ChevronRight, Download, Maximize2, Minimize2, X, ZoomIn, ZoomOut } from "lucide-react";
import DownloadPlugin from "yet-another-react-lightbox/plugins/download";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { useController, useNavigationState } from "yet-another-react-lightbox";
import type { ResourcePreviewSlide } from "./resource-preview";

type ResourcePreviewLightboxProps = {
  slides: readonly ResourcePreviewSlide[];
  open: boolean;
  index: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  onExited: () => void;
};

function NavigationButton({ direction }: { direction: "prev" | "next" }) {
  const { prev, next } = useController();
  const { prevDisabled, nextDisabled } = useNavigationState();
  const isPrevious = direction === "prev";
  const disabled = isPrevious ? prevDisabled : nextDisabled;
  const Icon = isPrevious ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      aria-label={isPrevious ? "Imagen anterior" : "Siguiente imagen"}
      disabled={disabled}
      className={`yarl__button yarl__navigation_${direction}`}
      onClick={() => (isPrevious ? prev() : next())}
    >
      <Icon className="yarl__icon" aria-hidden="true" />
    </button>
  );
}

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
      plugins={[Zoom, Fullscreen, DownloadPlugin]}
      zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true }}
      carousel={{
        finite: slides.length <= 1,
        preload: 2,
        imageFit: "contain",
      }}
      controller={{ aria: true }}
      render={{
        buttonPrev: () => <NavigationButton direction="prev" />,
        buttonNext: () => <NavigationButton direction="next" />,
        iconClose: () => <X aria-hidden="true" />,
        iconDownload: () => <Download aria-hidden="true" />,
        iconEnterFullscreen: () => <Maximize2 aria-hidden="true" />,
        iconExitFullscreen: () => <Minimize2 aria-hidden="true" />,
        iconZoomIn: () => <ZoomIn aria-hidden="true" />,
        iconZoomOut: () => <ZoomOut aria-hidden="true" />,
      }}
      styles={{
        root: {
          colorScheme: "dark",
          "--yarl__color_backdrop": "#000",
          "--yarl__container_background_color": "#000",
          "--yarl__color_button": "#FFF",
          "--yarl__color_button_active": "#D72228",
          "--yarl__color_button_disabled": "rgba(255, 255, 255, 0.40)",
          "--yarl__button_filter": "none",
          "--yarl__toolbar_padding": "12px",
          "--yarl__icon_size": "20px",
        },
      }}
      labels={{
        Next: "Siguiente imagen",
        Previous: "Imagen anterior",
        Close: "Cerrar vista previa",
        Download: "Descargar imagen",
        "Enter Fullscreen": "Abrir pantalla completa",
        "Exit Fullscreen": "Salir de pantalla completa",
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
