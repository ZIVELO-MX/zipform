"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";

export type SlideOverProps = {
  open: boolean;
  title: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onOpenChange: (open: boolean) => void;
  className?: string;
};

export function SlideOver({ open, title, children, footer, onOpenChange, className }: SlideOverProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

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
      ref={dialogRef}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          event.currentTarget.close();
        }
      }}
      className={cn(
        "fixed bottom-0 left-auto right-0 top-0 m-0 h-dvh max-h-none w-[min(520px,calc(100vw-48px))] max-w-none border-0 bg-[#FAFAF9] p-0 text-carbon shadow-[-8px_0_32px_rgba(29,29,27,0.10)] backdrop:bg-carbon/50 open:animate-in open:slide-in-from-right-6 open:duration-200",
        className
      )}
    >
      <div className="flex h-full flex-col border-l border-carbon/10">
        <header className="flex shrink-0 items-center justify-between border-b border-carbon/10 px-5 py-4">
          <h1 className="m-0 text-sm font-bold uppercase tracking-normal text-carbon/75">{title}</h1>
          <form method="dialog">
            <Button type="submit" variant="outline" size="icon" className="rounded-full bg-white" aria-label="Cerrar">
              <X size={16} aria-hidden="true" />
            </Button>
          </form>
        </header>
        <div className="flex-1 overflow-auto px-5 py-5">{children}</div>
        {footer ? <footer className="flex shrink-0 gap-2 border-t border-carbon/10 px-5 py-4">{footer}</footer> : null}
      </div>
    </dialog>
  );
}
