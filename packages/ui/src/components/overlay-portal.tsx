"use client";

import * as React from "react";

const OverlayPortalContext = React.createContext<HTMLElement | null>(null);

export function OverlayPortalProvider({ container, children }: { container: HTMLElement | null; children: React.ReactNode }) {
  return <OverlayPortalContext.Provider value={container}>{children}</OverlayPortalContext.Provider>;
}

export function useOverlayPortalContainer() {
  return React.useContext(OverlayPortalContext);
}
