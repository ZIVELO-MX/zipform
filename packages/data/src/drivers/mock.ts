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
import { buildTlozDashboardSummary, buildTlozMissionDetail, hydrateMissions, parseMarkdownChecklist } from "../tloz-hydration";

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
      async createProject(name) {
        const now = new Date().toISOString();
        const project = { id: randomUUID(), name, description: "", color: "#6B6B6B", icon: "Folder", status: "active" as const, createdAt: now, updatedAt: now };
        tlozData.projects.push(project);
        return project;
      },
      async createSeason(name) {
        const now = new Date().toISOString();
        const season = { id: randomUUID(), name, version: name, description: "", status: "active" as const, startDate: now.slice(0, 10), createdAt: now, updatedAt: now };
        tlozData.seasons.push(season);
        return season;
      },
      async createEpisode(name, seasonId) {
        const now = new Date().toISOString();
        const episode = { id: randomUUID(), seasonId, name, romanNumber: String(tlozData.episodes.filter((item) => item.seasonId === seasonId).length + 1), description: "", status: "active" as const, startDate: now.slice(0, 10), createdAt: now, updatedAt: now };
        tlozData.episodes.push(episode);
        return episode;
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
        const normalized = Object.fromEntries(Object.entries(input).map(([key, value]) => [
          key,
          value === "" && ["conclusion", "projectId", "seasonId", "episodeId", "dueDate", "startDate", "blockedReason"].includes(key) ? undefined : value
        ]));
        tlozData.missions[index] = { ...tlozData.missions[index], ...normalized, updatedAt: new Date().toISOString() };
        return getHydratedMission(missionId);
      },
      async saveMissionDocument(missionId, markdown) {
        const checklist = parseMarkdownChecklist(markdown);
        const progress = checklist.length ? Math.round((checklist.filter((item) => item.completed).length / checklist.length) * 100) : 0;
        await this.updateMission(missionId, { description: markdown, progress });
        const now = new Date().toISOString();
        tlozData.checklistItems = tlozData.checklistItems.filter((item) => item.missionId !== missionId);
        tlozData.checklistItems.push(...checklist.map((item, position) => ({
          id: randomUUID(), missionId, title: item.title, completed: item.completed, position, createdAt: now, updatedAt: now
        })));
        return (await this.getMissionDetail(missionId))!;
      },
      async addMissionDependency(missionId, dependsOnMissionId) {
        if (missionId === dependsOnMissionId) throw new Error("A mission cannot depend on itself");
        if (!tlozData.missionDependencies.some((item) => item.missionId === missionId && item.dependsOnMissionId === dependsOnMissionId)) {
          tlozData.missionDependencies.push({ id: randomUUID(), missionId, dependsOnMissionId, createdAt: new Date().toISOString() });
        }
        return (await this.getMissionDetail(missionId))!;
      },
      async removeMissionDependency(missionId, dependsOnMissionId) {
        tlozData.missionDependencies = tlozData.missionDependencies.filter((item) => item.missionId !== missionId || item.dependsOnMissionId !== dependsOnMissionId);
        return (await this.getMissionDetail(missionId))!;
      },
      async setMissionQuestItem(missionId, questItemId, required) {
        const current = tlozData.missionQuestItems.find((item) => item.missionId === missionId && item.questItemId === questItemId);
        if (current) current.required = required;
        else tlozData.missionQuestItems.push({ id: randomUUID(), missionId, questItemId, required, createdAt: new Date().toISOString() });
        return (await this.getMissionDetail(missionId))!;
      },
      async removeMissionQuestItem(missionId, questItemId) {
        tlozData.missionQuestItems = tlozData.missionQuestItems.filter((item) => item.missionId !== missionId || item.questItemId !== questItemId);
        return (await this.getMissionDetail(missionId))!;
      },
      async addMissionResource(missionId, input) {
        const now = new Date().toISOString();
        tlozData.resources.push({ id: randomUUID(), missionId, ...input, createdAt: now, updatedAt: now });
        return (await this.getMissionDetail(missionId))!;
      },
      async removeMissionResource(missionId, resourceId) {
        tlozData.resources = tlozData.resources.filter((item) => item.missionId !== missionId || item.id !== resourceId);
        return (await this.getMissionDetail(missionId))!;
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
