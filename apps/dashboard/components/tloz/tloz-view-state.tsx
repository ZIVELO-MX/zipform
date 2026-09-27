"use client";

import type { TlozProject, UserProfile } from "@tloz/types";
import { createContext, useContext, useEffect, useMemo, useOptimistic, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { collectionQueryHref, type CollectionQuery } from "./collection-query";
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
  serverQuery: boolean;
  queryPending: boolean;
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
  collectionQuery,
}: {
  children: React.ReactNode;
  supportedViews: TlozView[];
  defaultView: TlozView;
  projects: TlozProject[];
  users: UserProfile[];
  controlKind?: TlozControlKind;
  fixedProject?: boolean;
  storageScope?: string;
  collectionQuery?: CollectionQuery;
}) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [queryPending, startQueryTransition] = useTransition();
  const [optimisticQuery, setOptimisticQuery] = useOptimistic(collectionQuery);
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
    ownerId: optimisticQuery?.ownerId ?? (users.some((user) => user.id === preferredState.ownerId) ? preferredState.ownerId : "all"),
    showCompleted: optimisticQuery?.showCompleted ?? preferredState.showCompleted,
    sort: optimisticQuery?.sort ?? (capabilities.sortOptions.some((option) => option.id === preferredState.sort)
      ? preferredState.sort
      : "default"),
    grouping: capabilities.groupingOptions.some((option) => option.id === preferredState.grouping)
      ? preferredState.grouping
      : "none",
  }), [capabilities, optimisticQuery, effectiveDefault, preferredState, effectiveViews, projects, users]);

  const value = useMemo<TlozViewStateContextValue>(() => ({
    state,
    setState: (update) => {
      replaceState((current) => ({ ...current, ...update }));
      if (!collectionQuery || !("ownerId" in update || "showCompleted" in update || "sort" in update)) return;
      const next = { ...collectionQuery, ...update };
      const query: CollectionQuery = { ownerId: next.ownerId, showCompleted: next.showCompleted, sort: next.sort === "dependencies" ? "default" : next.sort };
      startQueryTransition(() => {
        setOptimisticQuery(query);
        router.replace(collectionQueryHref(pathname, searchParams.toString(), query), { scroll: false });
      });
    },
    supportedViews: effectiveViews,
    projects,
    users,
    capabilities,
    serverQuery: Boolean(collectionQuery),
    queryPending,
  }), [capabilities, collectionQuery, projects, state, effectiveViews, users, pathname, queryPending, router, searchParams, setOptimisticQuery]);

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
