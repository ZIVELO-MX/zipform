import { randomUUID } from "node:crypto";
import type { TlozMission } from "@zipform/types";
import type { ZipformDataClient } from "../contracts";
import {
  apps,
  checklistItems,
  currentUser,
  episodes,
  metrics,
  missionDependencies,
  missionQuestItems,
  missions,
  projects,
  questItems,
  resources,
  roadmap,
  seasons,
  userMissionStates,
  users
} from "../seed-data";
import { buildTlozDashboardSummary, buildTlozMissionDetail, hydrateMissions } from "../tloz-hydration";

export function createMockDataClient(): ZipformDataClient {
  const tlozData = {
    users: [...users],
    seasons: [...seasons],
    episodes: [...episodes],
    projects: [...projects],
    missions: missions.map((mission) => ({ ...mission })),
    missionDependencies: [...missionDependencies],
    questItems: [...questItems],
    missionQuestItems: [...missionQuestItems],
    checklistItems: [...checklistItems],
    resources: [...resources],
    userMissionStates: [...userMissionStates]
  };

  const getHydratedMission = (missionId: string) => {
    const mission = hydrateMissions(tlozData).find((item) => item.id === missionId);
    if (!mission) throw new Error(`TLOZ mission ${missionId} was not found`);
    return mission;
  };

  return {
    apps: {
      async list() {
        return apps;
      },
      async getById(id) {
        return apps.find((app) => app.id === id) ?? null;
      }
    },
    roadmap: {
      async getSnapshot() {
        return roadmap;
      }
    },
    user: {
      async getCurrent() {
        return currentUser;
      }
    },
    platform: {
      async getMetrics() {
        return metrics;
      }
    },
    tloz: {
      async getDashboardSummary() {
        return buildTlozDashboardSummary(tlozData, currentUser.id);
      },
      async getMissions(filters = {}) {
        return hydrateMissions(tlozData).filter((mission) =>
          (!filters.projectId || mission.projectId === filters.projectId) &&
          (!filters.seasonId || mission.seasonId === filters.seasonId) &&
          (!filters.episodeId || mission.episodeId === filters.episodeId) &&
          (!filters.ownerId || mission.ownerId === filters.ownerId)
        );
      },
      async getMissionDetail(missionId) {
        return buildTlozMissionDetail(tlozData, missionId);
      },
      async getProjects() {
        return projects;
      },
      async getSeasons() {
        return seasons;
      },
      async getEpisodes() {
        return episodes;
      },
      async getQuestItems() {
        return questItems;
      },
      async createMission(input) {
        const now = new Date().toISOString();
        const mission: TlozMission = {
          ...input,
          id: input.id ?? randomUUID(),
          createdAt: now,
          updatedAt: now
        };
        tlozData.missions.push(mission);
        return getHydratedMission(mission.id);
      },
      async updateMission(missionId, input) {
        const index = tlozData.missions.findIndex((mission) => mission.id === missionId);
        if (index < 0) throw new Error(`TLOZ mission ${missionId} was not found`);
        tlozData.missions[index] = { ...tlozData.missions[index], ...input, updatedAt: new Date().toISOString() };
        return getHydratedMission(missionId);
      },
      async patchMissionStatus(missionId, status) {
        return this.updateMission(missionId, {
          status,
          completedAt: status === "completed" ? new Date().toISOString() : undefined
        });
      },
      async deleteMission(missionId) {
        const index = tlozData.missions.findIndex((mission) => mission.id === missionId);
        if (index < 0) throw new Error(`TLOZ mission ${missionId} was not found`);
        tlozData.missions.splice(index, 1);
        tlozData.missionDependencies = tlozData.missionDependencies.filter(
          (item) => item.missionId !== missionId && item.dependsOnMissionId !== missionId
        );
        tlozData.missionQuestItems = tlozData.missionQuestItems.filter((item) => item.missionId !== missionId);
        tlozData.checklistItems = tlozData.checklistItems.filter((item) => item.missionId !== missionId);
        tlozData.resources = tlozData.resources.filter((item) => item.missionId !== missionId);
        tlozData.userMissionStates = tlozData.userMissionStates.filter((item) => item.missionId !== missionId);
      }
    }
  };
}
