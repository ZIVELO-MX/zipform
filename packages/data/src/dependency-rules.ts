import type { TlozMission } from "@zipform/types";

export function assertProjectScopedDependency(
  mission: Pick<TlozMission, "id" | "projectId"> | null | undefined,
  dependency: Pick<TlozMission, "id" | "projectId"> | null | undefined,
) {
  if (!mission || !dependency) throw new Error("Both missions must exist");
  if (mission.id === dependency.id) throw new Error("A mission cannot depend on itself");
  if (!mission.projectId || mission.projectId !== dependency.projectId) {
    throw new Error("Mission dependencies must belong to the same project");
  }
}
