import { describe, expect, it } from "vitest";
import {
  checklistItems,
  currentUser,
  episodes,
  missionDependencies,
  missionQuestItems,
  missions,
  projects,
  questItems,
  resources,
  seasons,
  userMissionStates,
  users
} from "./seed-data";
import { buildTlozDashboardSummary, buildTlozMissionDetail, hydrateMission, hydrateMissions } from "./tloz-hydration";

const data = { users, seasons, episodes, projects, missions, missionDependencies, questItems, missionQuestItems, checklistItems, resources, userMissionStates };

describe("TLOZ hydration", () => {
  it("hydrates mission relationships and required quest items", () => {
    const source = missions.find((mission) => missionDependencies.some((dependency) => dependency.missionId === mission.id)) ?? missions[0];
    const result = hydrateMission(data, source);
    expect(result.project?.id).toBe(source.projectId);
    expect(result.owner.id).toBe(source.ownerId);
    expect(result.dependencies.every((item) => missions.some((mission) => mission.id === item.id))).toBe(true);
    expect(result.requiredQuestItems.every((item) => result.questItems.includes(item))).toBe(true);
  });

  it("uses a stable fallback owner when a referenced user is missing", () => {
    const source = { ...missions[0], ownerId: "missing-user" };
    expect(hydrateMission(data, source).owner).toMatchObject({ id: "missing-user", name: "missing-user" });
  });

  it("supports missions without a project", () => {
    expect(hydrateMission(data, { ...missions[0], projectId: undefined }).project).toBeUndefined();
  });

  it("hydrates every mission and builds dashboard groups", () => {
    expect(hydrateMissions(data)).toHaveLength(missions.length);
    const summary = buildTlozDashboardSummary(data, currentUser.id);
    expect(summary.nowMissions.every((mission) => mission.status === "now")).toBe(true);
    expect(summary.projects).toHaveLength(projects.length);
    expect(summary.projects.reduce((total, project) => total + project.totalMissions, 0)).toBe(missions.length);
  });

  it("builds sorted detail and returns null for unknown missions", () => {
    const detail = buildTlozMissionDetail(data, missions[0].id);
    expect(detail?.checklist).toEqual([...(detail?.checklist ?? [])].sort((a, b) => a.position - b.position));
    expect(detail?.checklistCount).toBe(detail?.checklist.length);
    expect(detail?.completed).toBe(detail?.checklist.filter((item) => item.completed).length);
    expect(detail?.resources.every((item) => item.missionId === missions[0].id)).toBe(true);
    expect(detail?.requiredBy.every((item) => item.id !== missions[0].id)).toBe(true);
    expect(buildTlozMissionDetail(data, "missing")).toBeNull();
  });
});
