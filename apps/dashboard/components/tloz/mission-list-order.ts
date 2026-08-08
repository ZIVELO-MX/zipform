import type { TlozFieldOption } from "@tloz/types";

const PRIMARY_STATUS_ORDER = ["now", "next", "later"] as const;

export function orderMissionListStatuses(
  statuses: string[],
  configuredOptions: TlozFieldOption[] = [],
) {
  const present = new Set(statuses);
  const ordered: string[] = [];

  function append(status: string) {
    if (present.has(status) && !ordered.includes(status)) ordered.push(status);
  }

  PRIMARY_STATUS_ORDER.forEach(append);
  configuredOptions
    .filter((option) => option.value !== "completed")
    .forEach((option) => append(option.value));
  statuses
    .filter((status) => status !== "completed")
    .forEach(append);
  append("completed");

  return ordered;
}
