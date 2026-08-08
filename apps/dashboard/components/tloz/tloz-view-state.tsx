"use client";

import type { TlozProject, UserProfile } from "@tloz/types";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { resolveResponsiveTlozViews, resolveTlozView, type TlozView } from "../../lib/tloz-routes";
import {
  resolveTlozControlCapabilities,
  type TlozControlCapabilities,
  type TlozControlKind,
} from "./tloz-control-capabilities";
import { loadTlozUiState, saveTlozUiState } from "./tloz-view-storage";

export type TlozSort = "default" | "due-date" | "acquired-date" | "title" | "dependencies";
export type TlozGrouping = "status" | "project" | "none";

export type TlozUiState = {
  view: TlozView;
  projectId: string;
  ownerId: string;
  sort: TlozSort;
  grouping: TlozGrouping;
  showCompleted: boolean;
};

type TlozViewStateContextValue = {
  state: TlozUiState;
  setState: (update: Partial<TlozUiState>) => void;
  supportedViews: readonly TlozView[];
  projects: TlozProject[];
  users: UserProfile[];
  capabilities: TlozControlCapabilities;
};

const TlozViewStateContext = createContext<TlozViewStateContextValue | null>(null);

export function TlozViewStateProvider({
  children,
  supportedViews,
  defaultView,
  projects,
  users,
  controlKind = "mission",
  fixedProject = false,
  storageScope = "tloz-controls",
}: {
  children: React.ReactNode;
  supportedViews: TlozView[];
  defaultView: TlozView;
  projects: TlozProject[];
  users: UserProfile[];
  controlKind?: TlozControlKind;
  fixedProject?: boolean;
  storageScope?: string;
}) {
  const isMobile = useIsMobile();
  const responsiveViews = useMemo(
    () => resolveResponsiveTlozViews(isMobile, supportedViews, defaultView),
    [defaultView, isMobile, supportedViews],
  );
  const effectiveViews = responsiveViews.views;
  const effectiveDefault = responsiveViews.defaultView;
  const capabilities = useMemo(
    () => resolveTlozControlCapabilities(controlKind, fixedProject),
    [controlKind, fixedProject],
  );

  const [preferredState, replaceState] = useState<TlozUiState>(
    () => initialState(effectiveDefault),
  );
  const [storageLoaded, setStorageLoaded] = useState(false);

  useEffect(() => {
    const storage = browserStorage();
    const stored = storage ? loadTlozUiState(storage, storageScope) : null;
    if (!stored) {
      setStorageLoaded(true);
      return;
    }
    replaceState((current) => {
      const next = {
        ...current,
        ...stored,
        view: stored.view ?? current.view,
      };
      return next;
    });
    setStorageLoaded(true);
    // State is intentionally loaded only when this route scope mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveDefault, effectiveViews, storageScope]);

  useEffect(() => {
    const storage = browserStorage();
    if (storageLoaded && storage) saveTlozUiState(storage, storageScope, preferredState);
  }, [preferredState, storageLoaded, storageScope]);

  const state = useMemo<TlozUiState>(() => ({
    ...preferredState,
    view: resolveTlozView(preferredState.view, effectiveViews, effectiveDefault),
    projectId: capabilities.projectFilter
      && projects.some((project) => project.id === preferredState.projectId)
      ? preferredState.projectId
      : "all",
    ownerId: users.some((user) => user.id === preferredState.ownerId)
      ? preferredState.ownerId
      : "all",
    sort: capabilities.sortOptions.some((option) => option.id === preferredState.sort)
      ? preferredState.sort
      : "default",
    grouping: capabilities.groupingOptions.some((option) => option.id === preferredState.grouping)
      ? preferredState.grouping
      : "none",
  }), [capabilities, effectiveDefault, preferredState, effectiveViews, projects, users]);

  const value = useMemo<TlozViewStateContextValue>(() => ({
    state,
    setState: (update) => replaceState((current) => ({ ...current, ...update })),
    supportedViews: effectiveViews,
    projects,
    users,
    capabilities,
  }), [capabilities, projects, state, effectiveViews, users]);

  return <TlozViewStateContext.Provider value={value}>{children}</TlozViewStateContext.Provider>;
}

export function useTlozViewState() {
  const context = useContext(TlozViewStateContext);
  if (!context) throw new Error("useTlozViewState must be used inside TlozViewStateProvider");
  return context;
}

function initialState(view: TlozView): TlozUiState {
  return {
    view,
    projectId: "all",
    ownerId: "all",
    sort: "default",
    grouping: "status",
    showCompleted: true,
  };
}

function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
