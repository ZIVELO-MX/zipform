"use client";

import { createContext, useContext } from "react";
import type { TlozUiCapabilities } from "../../lib/authorization";

const TlozCapabilitiesContext = createContext<TlozUiCapabilities | null>(null);

export function TlozCapabilitiesProvider({ capabilities, children }: { capabilities: TlozUiCapabilities; children: React.ReactNode }) {
  return <TlozCapabilitiesContext.Provider value={capabilities}>{children}</TlozCapabilitiesContext.Provider>;
}

export function useTlozCapabilities() {
  return useContext(TlozCapabilitiesContext) ?? {
    canCreate: false,
    canUpdate: false,
    canMove: false,
    canDelete: false,
    canManageRoles: false,
    canManageAgents: false,
  } satisfies TlozUiCapabilities;
}
