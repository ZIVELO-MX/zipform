"use client";

import * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const OverlayToasterContext = React.createContext<string | undefined>(undefined);

export function OverlayToasterProvider({ toasterId, children }: { toasterId: string; children: React.ReactNode }) {
  return <OverlayToasterContext.Provider value={toasterId}>{children}</OverlayToasterContext.Provider>;
}

export function useOverlayToasterId() {
  return React.useContext(OverlayToasterContext);
}

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "!rounded-xl !border-carbon/10 !bg-paper !text-carbon !shadow-[0_18px_48px_rgba(29,29,27,0.18)]",
          description: "!text-carbon/60",
        },
      }}
      {...props}
    />
  );
}

export { toast } from "sonner";
