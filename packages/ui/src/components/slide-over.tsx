"use client";

import * as React from "react";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./resizable";
import { OverlayPortalProvider } from "./overlay-portal";
import { OverlayToasterProvider, Toaster } from "./sonner";

const SlideOverPendingContext = React.createContext<(() => () => void) | null>(null);

export function useSlideOverPending(pending: boolean) {
  const register = React.useContext(SlideOverPendingContext);
  React.useEffect(() => {
    if (pending) return register?.();
  }, [pending, register]);
}

export type SlideOverProps = {
  open: boolean;
  title: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onBack?: () => void;
  onOpenChange: (open: boolean) => void;
  className?: string;
  dismissible?: boolean;
};

export function SlideOver({ open, title, children, footer, onBack, onOpenChange, className, dismissible = true }: SlideOverProps) {
  const [pendingCount, setPendingCount] = React.useState(0);
  const registerPending = React.useCallback(() => {
    setPendingCount((count) => count + 1);
    return () => setPendingCount((count) => count - 1);
  }, []);
  const canDismiss = dismissible && pendingCount === 0;
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const toasterId = React.useId();
  const titleId = React.useId();
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
      aria-labelledby={titleId}
      onCancel={(event) => { if (!canDismiss) event.preventDefault(); }}
      className={cn(
        "mission-slide-over fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-carbon backdrop:bg-carbon/40",
        className
      )}
    >
      <SlideOverPendingContext.Provider value={registerPending}>
      <OverlayPortalProvider container={portalContainer}>
      <OverlayToasterProvider toasterId={toasterId}>
      <button type="button" disabled={!canDismiss} tabIndex={-1} className="absolute inset-0 cursor-default" aria-label="Cerrar panel" data-slide-over-backdrop onClick={() => dialogRef.current?.close()} />
      <ResizablePanelGroup orientation="horizontal" className="slide-over-panels pointer-events-none relative">
        <ResizablePanel minSize="5%" maxSize="55%" className="hidden sm:block" aria-label="Área fuera del panel" />
        <ResizableHandle aria-label="Redimensionar panel" className="pointer-events-auto hidden sm:flex" />
        <ResizablePanel defaultSize="960px" minSize="45%" maxSize="95%" className="slide-over-content-panel pointer-events-auto min-w-0">
          <div className="flex h-dvh flex-col border-l border-carbon/10 bg-[#FAFAF9] shadow-[-12px_0_48px_rgba(29,29,27,0.16)]">
            <header className="flex shrink-0 items-center gap-3 border-b border-carbon/10 px-4 py-2 sm:px-5">
              {onBack ? <Button type="button" variant="ghost" size="icon" aria-label="Volver a la misión anterior" disabled={!canDismiss} onClick={onBack}><ArrowLeft aria-hidden="true" /></Button> : <form method="dialog" className="sm:hidden"><Button type="submit" disabled={!canDismiss} variant="ghost" size="icon" aria-label="Volver al board"><ArrowLeft aria-hidden="true" /></Button></form>}
              <h2 id={titleId} className="m-0 min-w-0 flex-1 truncate text-sm font-bold text-carbon/75">{title}</h2>
              <form method="dialog" className="hidden sm:block"><Button type="submit" disabled={!canDismiss} variant="outline" size="icon" className="size-8 rounded-lg border-transparent bg-transparent text-carbon/65 shadow-none hover:bg-carbon/5" aria-label="Cerrar"><X aria-hidden="true" /></Button></form>
            </header>
            <div className="slide-over-scroll min-h-0 flex-1 overflow-auto overscroll-contain">{children}</div>
            {footer ? <footer className="flex shrink-0 gap-2 border-t border-carbon/10 px-5 py-4">{footer}</footer> : null}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      {open ? <Toaster id={toasterId} /> : null}
      </OverlayToasterProvider>
      </OverlayPortalProvider>
      </SlideOverPendingContext.Provider>
    </dialog>
  );
}
