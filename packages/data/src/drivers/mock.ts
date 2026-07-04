import type { TlozMission, TlozProject, TlozQuestItem, TlozResource, UserProfile } from "@zipform/types";
import type { TlozMissionRecord } from "../contracts";
import type { PaginatedResult, PaginationInput, ProjectFilters, QuestItemFilters, ResourceFilters, TlozMissionFilters, UserFilters, ZipformDataClient } from "../contracts";
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
import { assertProjectScopedDependency } from "../dependency-rules";
import { nextMissionDisplayId, uniqueSlug, validateMissionCreate, validateProjectCreate, validateQuestItemCreate } from "../tloz-validation";

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
      async findUsers(filters?: UserFilters, pagination?: PaginationInput): Promise<PaginatedResult<UserProfile>> {
        let data = [...tlozData.users];
        if (filters?.email) data = data.filter((u) => u.email.toLowerCase() === filters.email!.toLowerCase());
        if (filters?.username) data = data.filter((u) => u.username === filters.username);
        const limit = Math.min(pagination?.limit ?? 25, 100);
        const sliced = data.slice(0, limit);
        return { data: sliced, nextCursor: data.length > limit ? sliced[sliced.length - 1]?.id ?? null : null };
      },
      async findProjects(filters?: ProjectFilters, pagination?: PaginationInput): Promise<PaginatedResult<TlozProject>> {
        let data = [...tlozData.projects];
        if (filters?.ownerId) data = data.filter((p) => p.ownerId === filters.ownerId);
        if (filters?.status) data = data.filter((p) => p.status === filters.status);
        const limit = Math.min(pagination?.limit ?? 25, 100);
        const sliced = data.slice(0, limit);
        return { data: sliced, nextCursor: data.length > limit ? sliced[sliced.length - 1]?.id ?? null : null };
      },
      async findMissions(filters?: TlozMissionFilters, pagination?: PaginationInput): Promise<PaginatedResult<TlozMissionRecord>> {
        let data = hydrateMissions(tlozData);
        if (filters?.projectId) data = data.filter((m) => m.projectId === filters.projectId);
        if (filters?.seasonId) data = data.filter((m) => m.seasonId === filters.seasonId);
        if (filters?.episodeId) data = data.filter((m) => m.episodeId === filters.episodeId);
        if (filters?.ownerId) data = data.filter((m) => m.ownerId === filters.ownerId);
        if (filters?.status) data = data.filter((m) => m.status === filters.status);
        if (filters?.title) data = data.filter((m) => m.title.toLowerCase().includes(filters.title!.toLowerCase()));
        const limit = Math.min(pagination?.limit ?? 25, 100);
        const sliced = data.slice(0, limit);
        return { data: sliced, nextCursor: data.length > limit ? sliced[sliced.length - 1]?.id ?? null : null };
      },
      async findQuestItems(filters?: QuestItemFilters, pagination?: PaginationInput): Promise<PaginatedResult<TlozQuestItem>> {
        let data = [...tlozData.questItems];
        if (filters?.ownerId) data = data.filter((q) => q.ownerId === filters.ownerId);
        if (filters?.status) data = data.filter((q) => q.status === filters.status);
        if (filters?.category) data = data.filter((q) => q.category === filters.category);
        const limit = Math.min(pagination?.limit ?? 25, 100);
        const sliced = data.slice(0, limit);
        return { data: sliced, nextCursor: data.length > limit ? sliced[sliced.length - 1]?.id ?? null : null };
      },
      async findResources(filters?: ResourceFilters, pagination?: PaginationInput): Promise<PaginatedResult<TlozResource>> {
        let data = [...tlozData.resources];
        if (filters?.missionId) data = data.filter((r) => r.missionId === filters.missionId);
        if (filters?.projectId) data = data.filter((r) => r.projectId === filters.projectId);
        if (filters?.questItemId) data = data.filter((r) => r.questItemId === filters.questItemId);
        if (filters?.type) data = data.filter((r) => r.type === filters.type);
        const limit = Math.min(pagination?.limit ?? 25, 100);
        const sliced = data.slice(0, limit);
        return { data: sliced, nextCursor: data.length > limit ? sliced[sliced.length - 1]?.id ?? null : null };
      },
      async getProjects() {
        return tlozData.projects;
      },
      async getSeasons() {
        return seasons;
      },
      async getEpisodes() {
        return episodes;
      },
      async getQuestItems() {
        return tlozData.questItems;
      },
      async getResources() {
        return tlozData.resources;
      },
      async getUsers() {
        return tlozData.users;
      },
      async createProject(input) {
        const valid = validateProjectCreate(input);
        const now = new Date().toISOString();
        if (!tlozData.users.some((user) => user.id === valid.ownerId)) throw new Error("TLOZ project owner was not found");
        const project = { ...valid, descriptionDetail: input.descriptionDetail ?? "", id: crypto.randomUUID(), slug: uniqueSlug(valid.name, tlozData.projects.map((item) => item.slug)), createdAt: now, updatedAt: now };
        tlozData.projects.push(project);
        return project;
      },
      async createQuestItem(input) {
        const valid = validateQuestItemCreate(input);
        if (valid.ownerId && !tlozData.users.some((user) => user.id === valid.ownerId)) throw new Error("TLOZ inventory owner was not found");
        const now = new Date().toISOString();
        const item = { ...valid, descriptionDetail: input.descriptionDetail ?? "", id: crypto.randomUUID(), createdAt: now, updatedAt: now };
        tlozData.questItems.push(item);
        return item;
      },
      async updateProject(projectId, input) {
        const index = tlozData.projects.findIndex((item) => item.id === projectId);
        if (index < 0) throw new Error(`TLOZ project ${projectId} was not found`);
        const normalized = { ...input, dueDate: input.dueDate || undefined };
        tlozData.projects[index] = { ...tlozData.projects[index], ...normalized, updatedAt: new Date().toISOString() };
        return tlozData.projects[index];
      },
      async updateQuestItem(questItemId, input) {
        const index = tlozData.questItems.findIndex((item) => item.id === questItemId);
        if (index < 0) throw new Error(`TLOZ inventory item ${questItemId} was not found`);
        const normalized = { ...input, ownerId: input.ownerId || undefined, acquiredAt: input.acquiredAt || undefined };
        tlozData.questItems[index] = { ...tlozData.questItems[index], ...normalized, updatedAt: new Date().toISOString() };
        return tlozData.questItems[index];
      },
      async createSeason(name) {
        const now = new Date().toISOString();
        const season = { id: crypto.randomUUID(), name, version: name, description: "", status: "active" as const, startDate: now.slice(0, 10), createdAt: now, updatedAt: now };
        tlozData.seasons.push(season);
        return season;
      },
      async createEpisode(name, seasonId) {
        const now = new Date().toISOString();
        const episode = { id: crypto.randomUUID(), seasonId, name, romanNumber: String(tlozData.episodes.filter((item) => item.seasonId === seasonId).length + 1), description: "", status: "active" as const, startDate: now.slice(0, 10), createdAt: now, updatedAt: now };
        tlozData.episodes.push(episode);
        return episode;
      },
      async createMission(input) {
        const valid = validateMissionCreate(input);
        const project = tlozData.projects.find((item) => item.id === valid.projectId);
        if (!project) throw new Error("TLOZ mission project was not found");
        if (!tlozData.users.some((user) => user.id === valid.ownerId)) throw new Error("TLOZ mission owner was not found");
        const now = new Date().toISOString();
        const mission: TlozMission = {
          ...valid,
          id: valid.id ?? crypto.randomUUID(),
          displayId: nextMissionDisplayId(project.name, tlozData.missions.map((item) => item.displayId)),
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
        if (input.projectId && input.projectId !== tlozData.missions[index].projectId) {
          const project = tlozData.projects.find((item) => item.id === input.projectId);
          if (!project) throw new Error("TLOZ mission project was not found");
          normalized.displayId = nextMissionDisplayId(project.name, tlozData.missions.map((item) => item.displayId));
        }
        tlozData.missions[index] = { ...tlozData.missions[index], ...normalized, updatedAt: new Date().toISOString() };
        if (Object.prototype.hasOwnProperty.call(input, "projectId")) {
          tlozData.missionDependencies = tlozData.missionDependencies.filter(
            (item) => item.missionId !== missionId && item.dependsOnMissionId !== missionId,
          );
        }
        return getHydratedMission(missionId);
      },
      async saveMissionDocument(missionId, markdown) {
        const checklist = parseMarkdownChecklist(markdown);
        const progress = checklist.length ? Math.round((checklist.filter((item) => item.completed).length / checklist.length) * 100) : 0;
        await this.updateMission(missionId, { description: markdown, progress });
        const now = new Date().toISOString();
        tlozData.checklistItems = tlozData.checklistItems.filter((item) => item.missionId !== missionId);
        tlozData.checklistItems.push(...checklist.map((item, position) => ({
          id: crypto.randomUUID(), missionId, title: item.title, completed: item.completed, position, createdAt: now, updatedAt: now
        })));
        return (await this.getMissionDetail(missionId))!;
      },
      async addMissionDependency(missionId, dependsOnMissionId) {
        assertProjectScopedDependency(
          tlozData.missions.find((item) => item.id === missionId),
          tlozData.missions.find((item) => item.id === dependsOnMissionId),
        );
        if (!tlozData.missionDependencies.some((item) => item.missionId === missionId && item.dependsOnMissionId === dependsOnMissionId)) {
          tlozData.missionDependencies.push({ id: crypto.randomUUID(), missionId, dependsOnMissionId, createdAt: new Date().toISOString() });
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
        else tlozData.missionQuestItems.push({ id: crypto.randomUUID(), missionId, questItemId, required, createdAt: new Date().toISOString() });
        return (await this.getMissionDetail(missionId))!;
      },
      async removeMissionQuestItem(missionId, questItemId) {
        tlozData.missionQuestItems = tlozData.missionQuestItems.filter((item) => item.missionId !== missionId || item.questItemId !== questItemId);
        return (await this.getMissionDetail(missionId))!;
      },
      async addMissionResource(missionId, input) {
        const now = new Date().toISOString();
        tlozData.resources.push({ id: crypto.randomUUID(), missionId, ...input, createdAt: now, updatedAt: now });
        return (await this.getMissionDetail(missionId))!;
      },
      async removeMissionResource(missionId, resourceId) {
        tlozData.resources = tlozData.resources.filter((item) => item.missionId !== missionId || item.id !== resourceId);
        return (await this.getMissionDetail(missionId))!;
      },
      async addProjectResource(projectId, input) {
        const now = new Date().toISOString();
        tlozData.resources.push({ id: crypto.randomUUID(), projectId, ...input, createdAt: now, updatedAt: now });
        return tlozData.resources.filter((item) => item.projectId === projectId);
      },
      async removeProjectResource(projectId, resourceId) {
        tlozData.resources = tlozData.resources.filter((item) => item.id !== resourceId || item.projectId !== projectId);
        return tlozData.resources.filter((item) => item.projectId === projectId);
      },
      async addQuestItemResource(questItemId, input) {
        const now = new Date().toISOString();
        tlozData.resources.push({ id: crypto.randomUUID(), questItemId, ...input, createdAt: now, updatedAt: now });
        return tlozData.resources.filter((item) => item.questItemId === questItemId);
      },
      async removeQuestItemResource(questItemId, resourceId) {
        tlozData.resources = tlozData.resources.filter((item) => item.id !== resourceId || item.questItemId !== questItemId);
        return tlozData.resources.filter((item) => item.questItemId === questItemId);
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
