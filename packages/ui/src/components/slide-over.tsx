"use client";

import * as React from "react";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./resizable";
import { OverlayPortalProvider } from "./overlay-portal";
import { OverlayToasterProvider, Toaster } from "./sonner";

export type SlideOverProps = {
  open: boolean;
  title: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onBack?: () => void;
  onOpenChange: (open: boolean) => void;
  className?: string;
};

export function SlideOver({ open, title, children, footer, onBack, onOpenChange, className }: SlideOverProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const toasterId = React.useId();
  const [portalContainer, setPortalContainer] = React.useState<HTMLDialogElement | null>(null);
  const setDialogRef = React.useCallback((node: HTMLDialogElement | null) => { dialogRef.current = node; setPortalContainer(node); }, []);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onOpenChange(false);
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onOpenChange]);

  return (
    <dialog
      ref={setDialogRef}
      className={cn(
        "mission-slide-over fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-carbon backdrop:bg-carbon/60",
        className
      )}
    >
      <OverlayPortalProvider container={portalContainer}>
      <OverlayToasterProvider toasterId={toasterId}>
      <ResizablePanelGroup orientation="horizontal" className="slide-over-panels">
        <ResizablePanel defaultSize="35%" minSize="5%" maxSize="55%" className="hidden sm:block" onPointerDown={() => dialogRef.current?.close()} aria-label="Cerrar panel" />
        <ResizableHandle className="hidden sm:flex" />
        <ResizablePanel defaultSize="65%" minSize="45%" maxSize="95%" className="slide-over-content-panel min-w-0">
          <div className="flex h-dvh flex-col border-l border-carbon/10 bg-[#FAFAF9] shadow-[-12px_0_48px_rgba(29,29,27,0.16)]">
            <header className="flex shrink-0 items-center gap-3 border-b border-carbon/10 px-4 py-3 sm:px-5">
              {onBack ? <Button type="button" variant="ghost" size="icon" aria-label="Volver a la misión anterior" onClick={onBack}><ArrowLeft aria-hidden="true" /></Button> : <form method="dialog" className="sm:hidden"><Button type="submit" variant="ghost" size="icon" aria-label="Volver al board"><ArrowLeft aria-hidden="true" /></Button></form>}
              <h2 className="m-0 min-w-0 flex-1 truncate text-sm font-bold text-carbon/75">{title}</h2>
              <form method="dialog" className="hidden sm:block"><Button type="submit" variant="outline" size="icon" className="rounded-full bg-white" aria-label="Cerrar"><X aria-hidden="true" /></Button></form>
            </header>
            <div className="min-h-0 flex-1 overflow-auto">{children}</div>
            {footer ? <footer className="flex shrink-0 gap-2 border-t border-carbon/10 px-5 py-4">{footer}</footer> : null}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      {open ? <Toaster id={toasterId} /> : null}
      </OverlayToasterProvider>
      </OverlayPortalProvider>
    </dialog>
  );
}
