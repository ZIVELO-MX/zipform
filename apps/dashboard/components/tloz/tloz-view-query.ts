import type { TlozFieldOption } from "@tloz/types";
import type { MissionViewRecord } from "./mission-views";
import type { TlozUiState } from "./tloz-view-state";
import { topologicalMissionOrder } from "./tloz-utils";

type QueryOptions = {
  defaultSort: "dependencies" | "source";
};

export function filterAndSortTlozRecords(
  records: MissionViewRecord[],
  state: TlozUiState,
  statusOptions: TlozFieldOption[],
  options: QueryOptions,
): MissionViewRecord[] {
  const visible = records.filter((record) => (
    (state.projectId === "all" || record.projectId === state.projectId)
    && (state.ownerId === "all" || record.ownerId === state.ownerId)
    && (state.showCompleted || tlozStatusRole(record.status, statusOptions) !== "done")
  ));

  if (state.sort === "dependencies") return topologicalMissionOrder(visible);
  if (state.sort === "default") {
    return options.defaultSort === "dependencies"
      ? topologicalMissionOrder(visible)
      : visible;
  }

  return visible.sort((left, right) => {
    if (state.sort === "title") return left.title.localeCompare(right.title);
    if (state.sort === "acquired-date") {
      return (left.presentation?.acquiredDate ?? "9999-12-31")
        .localeCompare(right.presentation?.acquiredDate ?? "9999-12-31");
    }
    return (left.dueDate ?? "9999-12-31")
      .localeCompare(right.dueDate ?? "9999-12-31");
  });
}

export function tlozStatusRole(status: string, options: TlozFieldOption[]) {
  const defaults: Record<string, "active" | "blocked" | "ready" | "backlog" | "done"> = {
    now: "active",
    active: "active",
    maintenance: "ready",
    paused: "blocked",
    blocked: "blocked",
    next: "ready",
    later: "backlog",
    locked: "backlog",
    completed: "done",
    archived: "done",
    unlocked: "done",
    done: "done",
  };
  return options.find((option) => option.value === status)?.role ?? defaults[status] ?? "backlog";
}
