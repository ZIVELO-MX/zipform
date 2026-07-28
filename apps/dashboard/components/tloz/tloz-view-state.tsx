"use client";

import type { TlozProject, UserProfile } from "@tloz/types";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { resolveResponsiveTlozViews, resolveTlozView, type TlozView } from "../../lib/tloz-routes";
import { loadTlozUiState, saveTlozUiState } from "./tloz-view-storage";

export type TlozSort = "default" | "due-date" | "title" | "dependencies";
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
  showMissionControls: boolean;
};

const TlozViewStateContext = createContext<TlozViewStateContextValue | null>(null);
let sharedUiState: TlozUiState | undefined;

export function TlozViewStateProvider({
  children,
  supportedViews,
  defaultView,
  projects,
  users,
  inventory = false,
  showMissionControls = true,
  storageScope = "tloz-controls",
}: {
  children: React.ReactNode;
  supportedViews: TlozView[];
  defaultView: TlozView;
  projects: TlozProject[];
  users: UserProfile[];
  inventory?: boolean;
  showMissionControls?: boolean;
  storageScope?: string;
}) {
  const isMobile = useIsMobile();
  const responsiveViews = resolveResponsiveTlozViews(isMobile, supportedViews, defaultView);
  const effectiveViews = responsiveViews.views;
  const effectiveDefault = responsiveViews.defaultView;

  const [preferredState, replaceState] = useState<TlozUiState>(() => sharedUiState ?? initialState(effectiveDefault));
  const [storageLoaded, setStorageLoaded] = useState(false);

  useEffect(() => {
    const storage = browserStorage();
    const stored = storage ? loadTlozUiState(storage, storageScope) : null;
    if (!stored) {
      sharedUiState = preferredState;
      setStorageLoaded(true);
      return;
    }
    replaceState((current) => {
      const next = {
        ...current,
        ...stored,
        view: stored.view ?? current.view,
      };
      sharedUiState = next;
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
  }), [effectiveDefault, preferredState, effectiveViews]);

  const value = useMemo<TlozViewStateContextValue>(() => ({
    state,
    setState: (update) => replaceState((current) => {
      const next = { ...current, ...update };
      sharedUiState = next;
      return next;
    }),
    supportedViews: effectiveViews,
    projects,
    users,
    showMissionControls,
  }), [projects, showMissionControls, state, effectiveViews, users]);

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
    sort: "dependencies",
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
