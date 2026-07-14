import type { TlozUiState } from "./tloz-view-state";

export function tlozStorageKeys(scope: string) {
  return {
    current: `zipform-${scope}-v1`,
    legacy: `tloz:${scope}-controls`,
  };
}

export function loadTlozUiState(storage: Storage, scope: string): Partial<TlozUiState> | null {
  const keys = tlozStorageKeys(scope);
  const current = safelyRead(storage, keys.current);
  const currentState = parseStoredState(current);
  if (currentState) return currentState;

  if (current !== null) safelyRemove(storage, keys.current);

  const legacyState = parseStoredState(safelyRead(storage, keys.legacy));
  if (!legacyState) return null;

  try {
    storage.setItem(keys.current, JSON.stringify(legacyState));
    storage.removeItem(keys.legacy);
  } catch {
    // Keep the legacy value when migration cannot be persisted.
  }
  return legacyState;
}

export function saveTlozUiState(storage: Storage, scope: string, state: TlozUiState) {
  try {
    storage.setItem(tlozStorageKeys(scope).current, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function normalizeStoredState(state: Partial<TlozUiState>): Partial<TlozUiState> {
  const views: TlozUiState["view"][] = ["dashboard", "list", "board", "table", "calendar"];
  const sorts: TlozUiState["sort"][] = ["default", "due-date", "title", "dependencies"];
  const groupings: TlozUiState["grouping"][] = ["status", "project", "none"];
  return {
    view: views.includes(state.view as TlozUiState["view"]) ? state.view : undefined,
    projectId: typeof state.projectId === "string" ? state.projectId : "all",
    seasonId: typeof state.seasonId === "string" ? state.seasonId : "all",
    episodeId: typeof state.episodeId === "string" ? state.episodeId : "all",
    ownerId: typeof state.ownerId === "string" ? state.ownerId : "all",
    sort: sorts.includes(state.sort as TlozUiState["sort"]) ? state.sort : "dependencies",
    grouping: groupings.includes(state.grouping as TlozUiState["grouping"]) ? state.grouping : "status",
    showCompleted: typeof state.showCompleted === "boolean" ? state.showCompleted : true,
  };
}

function parseStoredState(value: string | null) {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return normalizeStoredState(parsed as Partial<TlozUiState>);
  } catch {
    return null;
  }
}

function safelyRead(storage: Storage, key: string) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safelyRemove(storage: Storage, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    // Storage may be unavailable; in-memory state remains usable.
  }
}
