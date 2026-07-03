import type {
  TlozChecklistItem,
  TlozEpisode,
  TlozMission,
  TlozMissionDependency,
  TlozMissionQuestItem,
  TlozProject,
  TlozQuestItem,
  TlozResource,
  TlozSeason,
  TlozUserMissionState,
  UserProfile
} from "@zipform/types";
import type { TlozDashboardSummary, TlozMissionDetail, TlozMissionRecord } from "./contracts";
import { recentActivity } from "./seed-data";

export type TlozDataSet = {
  users: UserProfile[];
  seasons: TlozSeason[];
  episodes: TlozEpisode[];
  projects: TlozProject[];
  missions: TlozMission[];
  missionDependencies: TlozMissionDependency[];
  questItems: TlozQuestItem[];
  missionQuestItems: TlozMissionQuestItem[];
  checklistItems: TlozChecklistItem[];
  resources: TlozResource[];
  userMissionStates: TlozUserMissionState[];
};

function byId<T extends { id: string }>(items: T[], id?: string) {
  return id ? items.find((item) => item.id === id) : undefined;
}

function computeDisplayId(data: TlozDataSet, mission: TlozMission): string {
  const project = byId(data.projects, mission.projectId);
  const abbr = project ? project.name.slice(0, 3).toUpperCase() : "ZZZ";
  const siblings = data.missions
    .filter((m) => m.projectId === mission.projectId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const index = siblings.findIndex((m) => m.id === mission.id);
  return `${abbr}-${String(index + 1).padStart(4, "0")}`;
}

export function hydrateMission(data: TlozDataSet, mission: TlozMission): TlozMissionRecord {
  const project = byId(data.projects, mission.projectId);

  const dependencyIds = data.missionDependencies
    .filter((dependency) => dependency.missionId === mission.id)
    .map((dependency) => dependency.dependsOnMissionId);
  const relatedQuestItems = data.missionQuestItems.filter((item) => item.missionId === mission.id);
  const missionQuestItemIds = relatedQuestItems.map((item) => item.questItemId);
  const hydratedQuestItems = data.questItems.filter((item) => missionQuestItemIds.includes(item.id));
  const requiredQuestItemIds = relatedQuestItems.filter((item) => item.required).map((item) => item.questItemId);
  const owner = byId(data.users, mission.ownerId);

  return {
    ...mission,
    displayId: computeDisplayId(data, mission),
    project,
    season: byId(data.seasons, mission.seasonId),
    episode: byId(data.episodes, mission.episodeId),
    dependencies: data.missions.filter((item) => dependencyIds.includes(item.id)),
    questItems: hydratedQuestItems,
    requiredQuestItems: hydratedQuestItems.filter((item) => requiredQuestItemIds.includes(item.id)),
    owner: owner ?? {
      id: mission.ownerId,
      name: mission.ownerId,
      username: mission.ownerId,
      email: "",
      role: "",
      avatarUrl: ""
    }
  };
}

export function hydrateMissions(data: TlozDataSet) {
  return data.missions.map((mission) => hydrateMission(data, mission));
}

export function buildTlozDashboardSummary(data: TlozDataSet, currentUserId: string): TlozDashboardSummary {
  const hydrated = hydrateMissions(data);
  const activeQuestId = data.userMissionStates.find(
    (state) => state.slot === "active_quest" && state.userId === currentUserId
  )?.missionId;
  const activeSupportQuestId = data.userMissionStates.find(
    (state) => state.slot === "support_quest" && state.userId === currentUserId
  )?.missionId;

  return {
    activeQuest: hydrated.find((mission) => mission.id === activeQuestId) ?? null,
    activeSupportQuest: hydrated.find((mission) => mission.id === activeSupportQuestId) ?? null,
    nowMissions: hydrated.filter((mission) => mission.status === "now"),
    mainQuests: hydrated.filter((mission) => mission.type === "main_quest" && mission.status !== "completed"),
    upcomingMissions: hydrated.filter((mission) => mission.status === "next"),
    futureMissions: hydrated.filter((mission) => mission.status === "later"),
    projects: data.projects.map((project) => {
      const projectMissions = hydrated.filter((mission) => mission.projectId === project.id);
      return {
        ...project,
        totalMissions: projectMissions.length,
        nowMissions: projectMissions.filter((mission) => mission.status === "now").length,
        completedMissions: projectMissions.filter((mission) => mission.status === "completed").length
      };
    }),
    recentActivity,
    questItems: data.questItems
  };
}

export function buildTlozMissionDetail(data: TlozDataSet, missionId: string): TlozMissionDetail | null {
  const mission = hydrateMissions(data).find((item) => item.id === missionId);

  if (!mission) {
    return null;
  }

  return {
    ...mission,
    checklist: data.checklistItems
      .filter((item) => item.missionId === mission.id)
      .sort((a, b) => a.position - b.position),
    resources: data.resources.filter((resource) => resource.missionId === mission.id),
    requiredBy: data.missionDependencies
      .filter((dependency) => dependency.dependsOnMissionId === mission.id)
      .map((dependency) => data.missions.find((item) => item.id === dependency.missionId))
      .filter((item): item is TlozMission => Boolean(item)),
    missionQuestItems: data.missionQuestItems.filter((item) => item.missionId === mission.id)
  };
}

export function parseMarkdownChecklist(markdown: string) {
  return markdown.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^\s*[-*+]\s+\[([ xX])\]\s+(.+?)\s*$/);
    return match ? [{ title: match[2], completed: match[1].toLowerCase() === "x" }] : [];
  });
}
