"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Command } from "cmdk";

function CommandDialog({ open, onOpenChange, label, className, children }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay cmdk-overlay="" />
      <DialogPrimitive.Content cmdk-dialog="" className={className} aria-describedby={undefined}>
        <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>
        <Command label={label}>{children}</Command>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}

export { Command, CommandDialog };
