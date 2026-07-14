import type { TlozMission } from "@zipform/types";

export type MissionDependencyEdge = Pick<TlozMission, "id"> & { dependsOnMissionId: string };

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

/** Rejects an edge when following dependencies from it can reach the mission again. */
export function assertAcyclicDependency(
  missionId: string,
  dependsOnMissionId: string,
  edges: MissionDependencyEdge[],
) {
  if (missionId === dependsOnMissionId) throw new Error("A mission cannot depend on itself");
  const outgoing = new Map<string, string[]>();
  for (const edge of edges) {
    const list = outgoing.get(edge.id) ?? [];
    list.push(edge.dependsOnMissionId);
    outgoing.set(edge.id, list);
  }
  const seen = new Set<string>();
  const stack = [dependsOnMissionId];
  while (stack.length) {
    const current = stack.pop()!;
    if (current === missionId) throw new Error("Mission dependencies cannot contain cycles");
    if (seen.has(current)) continue;
    seen.add(current);
    stack.push(...(outgoing.get(current) ?? []));
  }
}
