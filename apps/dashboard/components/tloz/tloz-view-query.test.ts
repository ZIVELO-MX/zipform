import type { TlozFieldOption } from "@tloz/types";
import { describe, expect, it } from "vitest";
import type { MissionViewRecord } from "./mission-views";
import type { TlozUiState } from "./tloz-view-state";
import { filterAndSortTlozRecords } from "./tloz-view-query";

const statusOptions: TlozFieldOption[] = [
  { value: "active", label: "Active", role: "active" },
  { value: "archived", label: "Archived", role: "done" },
  { value: "unlocked", label: "Unlocked", role: "done" },
];

describe("TLOZ view query", () => {
  it("filters owner, project, and completed records using status roles", () => {
    const records = [
      record("active-match", { ownerId: "user-1", projectId: "project-1" }),
      record("completed-match", { ownerId: "user-1", projectId: "project-1", status: "archived" }),
      record("other-owner", { ownerId: "user-2", projectId: "project-1" }),
      record("other-project", { ownerId: "user-1", projectId: "project-2" }),
    ];

    expect(filterAndSortTlozRecords(
      records,
      state({ ownerId: "user-1", projectId: "project-1", showCompleted: false }),
      statusOptions,
      { defaultSort: "source" },
    ).map((item) => item.id)).toEqual(["active-match"]);
  });

  it("sorts Inventory by acquired date and leaves missing dates last", () => {
    const records = [
      record("missing"),
      record("newer", { presentation: { typeLabel: "Inventory", typeTone: "#000", icon: "PackageOpen", acquiredDate: "2026-07-20" } }),
      record("older", { presentation: { typeLabel: "Inventory", typeTone: "#000", icon: "PackageOpen", acquiredDate: "2026-07-01" } }),
    ];

    expect(filterAndSortTlozRecords(
      records,
      state({ sort: "acquired-date" }),
      statusOptions,
      { defaultSort: "source" },
    ).map((item) => item.id)).toEqual(["older", "newer", "missing"]);
  });

  it("preserves source order for the default document sort", () => {
    const records = [record("second"), record("first")];

    expect(filterAndSortTlozRecords(
      records,
      state(),
      statusOptions,
      { defaultSort: "source" },
    ).map((item) => item.id)).toEqual(["second", "first"]);
  });
});

function state(overrides: Partial<TlozUiState> = {}): TlozUiState {
  return {
    view: "list",
    projectId: "all",
    ownerId: "all",
    sort: "default",
    grouping: "status",
    showCompleted: true,
    ...overrides,
  };
}

function record(
  id: string,
  overrides: Partial<MissionViewRecord> = {},
): MissionViewRecord {
  return {
    id,
    displayId: id,
    title: id,
    description: "",
    descriptionDetail: "",
    icon: "Sword",
    type: "main_quest",
    status: "active",
    ownerId: "user-1",
    projectId: "project-1",
    progress: 0,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    dependencies: [],
    questItems: [],
    requiredQuestItems: [],
    owner: {
      id: "user-1",
      name: "Zelda",
      username: "zelda",
      email: "zelda@example.com",
      role: "Owner",
      type: "human",
      avatarUrl: "",
      theme: "system",
    },
    ...overrides,
  } as MissionViewRecord;
}
