import { describe, expect, it } from "vitest";
import type { TlozUiState } from "./tloz-view-state";
import { loadTlozUiState, saveTlozUiState, tlozStorageKeys } from "./tloz-view-storage";

const state: TlozUiState = {
  view: "board",
  projectId: "project-tloz",
  seasonId: "all",
  episodeId: "all",
  ownerId: "all",
  sort: "dependencies",
  grouping: "status",
  showCompleted: false,
};

describe("TLOZ view storage", () => {
  it("uses the zipform versioned key before the legacy key", () => {
    const storage = memoryStorage();
    const keys = tlozStorageKeys("tloz-controls");
    storage.setItem(keys.current, JSON.stringify(state));
    storage.setItem(keys.legacy, JSON.stringify({ ...state, view: "list" }));

    expect(loadTlozUiState(storage, "tloz-controls")?.view).toBe("board");
    expect(storage.getItem(keys.legacy)).not.toBeNull();
  });

  it("migrates a legacy value and only removes it after a successful write", () => {
    const storage = memoryStorage();
    const keys = tlozStorageKeys("tloz-controls");
    storage.setItem(keys.legacy, JSON.stringify(state));

    expect(loadTlozUiState(storage, "tloz-controls")).toMatchObject(state);
    expect(storage.getItem(keys.current)).not.toBeNull();
    expect(storage.getItem(keys.legacy)).toBeNull();

    const failingStorage = memoryStorage({ failWrites: true });
    failingStorage.seed(keys.legacy, JSON.stringify(state));
    expect(loadTlozUiState(failingStorage, "tloz-controls")).toMatchObject(state);
    expect(failingStorage.getItem(keys.legacy)).not.toBeNull();
  });

  it("degrades to in-memory state when storage is malformed or unavailable", () => {
    const malformed = memoryStorage();
    malformed.setItem(tlozStorageKeys("tloz-controls").current, "{invalid");
    expect(loadTlozUiState(malformed, "tloz-controls")).toBeNull();

    const unavailable = memoryStorage({ failReads: true, failWrites: true });
    expect(loadTlozUiState(unavailable, "tloz-controls")).toBeNull();
    expect(saveTlozUiState(unavailable, "tloz-controls", state)).toBe(false);
  });
});

function memoryStorage(options: { failReads?: boolean; failWrites?: boolean } = {}) {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear() { values.clear(); },
    getItem(key: string) { if (options.failReads) throw new Error("storage unavailable"); return values.get(key) ?? null; },
    key(index: number) { return [...values.keys()][index] ?? null; },
    removeItem(key: string) { values.delete(key); },
    setItem(key: string, value: string) { if (options.failWrites) throw new Error("quota exceeded"); values.set(key, value); },
    seed(key: string, value: string) { values.set(key, value); },
  } satisfies Storage & { seed: (key: string, value: string) => void };
}
