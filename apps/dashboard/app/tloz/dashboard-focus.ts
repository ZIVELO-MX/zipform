import type { TlozMissionRecord } from "../../lib/tloz-data";

export function dashboardFocusMissionIds(missions: TlozMissionRecord[]) {
  const quest = missions.find((mission) => mission.type === "main_quest" || mission.type === "side_quest");
  const support = missions.find((mission) => mission.type === "farming_quest" || mission.type === "exploration_quest");
  return new Set([quest?.id, support?.id].filter((id): id is string => Boolean(id)));
}
