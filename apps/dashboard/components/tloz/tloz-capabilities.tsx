"use client";

import { createContext, useContext } from "react";
import type { TlozUiCapabilities } from "../../lib/authorization";

const CurrentUserIdContext = createContext<string | null>(null);

export function useCurrentUserId() { return useContext(CurrentUserIdContext); }

const TlozCapabilitiesContext = createContext<TlozUiCapabilities | null>(null);

export function TlozCapabilitiesProvider({ capabilities, currentUserId = null, children }: { capabilities: TlozUiCapabilities; currentUserId?: string | null; children: React.ReactNode }) {
  return <CurrentUserIdContext.Provider value={currentUserId}><TlozCapabilitiesContext.Provider value={capabilities}>{children}</TlozCapabilitiesContext.Provider></CurrentUserIdContext.Provider>;
}

export function useTlozCapabilities() {
  return useContext(TlozCapabilitiesContext) ?? {
    canCreate: false,
    canUpdate: false,
    canMove: false,
    canDelete: false,
    canManageRoles: false,
    canManageOwnApiKeys: false,
    canManageAgents: false,
  } satisfies TlozUiCapabilities;
}
