import { PrismaClient } from "@prisma/client";
import type {
  PlatformMetric,
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
import type { ZipformDataClient } from "../contracts";
import { apps, roadmap } from "../seed-data";
import {
  buildTlozDashboardSummary,
  buildTlozMissionDetail,
  hydrateMissions,
  parseMarkdownChecklist,
  type TlozDataSet
} from "../tloz-hydration";
import { assertProjectScopedDependency } from "../dependency-rules";
import { nextMissionDisplayId, uniqueSlug, validateMissionCreate, validateProjectCreate, validateQuestItemCreate } from "../tloz-validation";

function ensureDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    const cwd = process.cwd();
    const dbPath = cwd.includes("packages/data")
      ? `${cwd}/dev.db`
      : `${cwd}/packages/data/dev.db`;
    process.env.DATABASE_URL = `file:${dbPath}`;
  }
}

const globalForPrisma = globalThis as typeof globalThis & {
  zipformPrisma?: PrismaClient;
};

function getPrismaClient() {
  ensureDatabaseUrl();
  globalForPrisma.zipformPrisma ??= new PrismaClient();
  return globalForPrisma.zipformPrisma;
}

const toIso = (value: Date) => value.toISOString();

function mapUser(user: {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  avatarUrl: string;
}): UserProfile {
  return user;
}

function mapMetric(metric: { label: string; value: string; tone: string }): PlatformMetric {
  return {
    label: metric.label,
    value: metric.value,
    tone: metric.tone as PlatformMetric["tone"]
  };
}

function mapSeason(season: {
  id: string;
  name: string;
  version: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TlozSeason {
  return {
    ...season,
    status: season.status as TlozSeason["status"],
    endDate: season.endDate ?? undefined,
    createdAt: toIso(season.createdAt),
    updatedAt: toIso(season.updatedAt)
  };
}

function mapEpisode(episode: {
  id: string;
  seasonId: string;
  name: string;
  romanNumber: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TlozEpisode {
  return {
    ...episode,
    status: episode.status as TlozEpisode["status"],
    endDate: episode.endDate ?? undefined,
    createdAt: toIso(episode.createdAt),
    updatedAt: toIso(episode.updatedAt)
  };
}

function mapProject(project: {
  id: string;
  slug: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  status: string;
  type: string;
  ownerId: string;
  startDate: string;
  dueDate: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TlozProject {
  return {
    ...project,
    status: project.status as TlozProject["status"],
    type: project.type as TlozProject["type"],
    dueDate: project.dueDate ?? undefined,
    createdAt: toIso(project.createdAt),
    updatedAt: toIso(project.updatedAt)
  };
}

function mapMission(mission: {
  id: string;
  displayId: string;
  title: string;
  description: string;
  icon: string;
  type: string;
  status: string;
  conclusion: string | null;
  ownerId: string;
  projectId: string | null;
  seasonId: string | null;
  episodeId: string | null;
  dueDate: string | null;
  startDate: string | null;
  completedAt: Date | null;
  blockedReason: string | null;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}): TlozMission {
  return {
    ...mission,
    type: mission.type as TlozMission["type"],
    status: mission.status as TlozMission["status"],
    conclusion: mission.conclusion ?? undefined,
    projectId: mission.projectId ?? undefined,
    seasonId: mission.seasonId ?? undefined,
    episodeId: mission.episodeId ?? undefined,
    dueDate: mission.dueDate ?? undefined,
    startDate: mission.startDate ?? undefined,
    completedAt: mission.completedAt ? toIso(mission.completedAt) : undefined,
    blockedReason: mission.blockedReason ?? undefined,
    createdAt: toIso(mission.createdAt),
    updatedAt: toIso(mission.updatedAt)
  };
}

function mapDependency(dependency: {
  id: string;
  missionId: string;
  dependsOnMissionId: string;
  createdAt: Date;
}): TlozMissionDependency {
  return {
    ...dependency,
    createdAt: toIso(dependency.createdAt)
  };
}

function mapQuestItem(item: {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: string;
  category: string;
  ownerId: string | null;
  acquiredAt: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TlozQuestItem {
  return {
    ...item,
    status: item.status as TlozQuestItem["status"],
    category: item.category as TlozQuestItem["category"],
    ownerId: item.ownerId ?? undefined,
    acquiredAt: item.acquiredAt ?? undefined,
    createdAt: toIso(item.createdAt),
    updatedAt: toIso(item.updatedAt)
  };
}

function mapMissionQuestItem(item: {
  id: string;
  missionId: string;
  questItemId: string;
  required: boolean;
  createdAt: Date;
}): TlozMissionQuestItem {
  return {
    ...item,
    createdAt: toIso(item.createdAt)
  };
}

function mapChecklistItem(item: {
  id: string;
  missionId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}): TlozChecklistItem {
  return {
    ...item,
    createdAt: toIso(item.createdAt),
    updatedAt: toIso(item.updatedAt)
  };
}

function mapResource(resource: {
  id: string;
  missionId: string | null;
  projectId: string | null;
  questItemId: string | null;
  type: string;
  title: string;
  url: string | null;
  fileId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TlozResource {
  return {
    ...resource,
    type: resource.type as TlozResource["type"],
    missionId: resource.missionId ?? undefined,
    projectId: resource.projectId ?? undefined,
    questItemId: resource.questItemId ?? undefined,
    url: resource.url ?? undefined,
    fileId: resource.fileId ?? undefined,
    createdAt: toIso(resource.createdAt),
    updatedAt: toIso(resource.updatedAt)
  };
}

function mapUserMissionState(state: {
  id: string;
  userId: string;
  missionId: string;
  slot: string;
  createdAt: Date;
  updatedAt: Date;
}): TlozUserMissionState {
  return {
    ...state,
    slot: state.slot as TlozUserMissionState["slot"],
    createdAt: toIso(state.createdAt),
    updatedAt: toIso(state.updatedAt)
  };
}

async function getCurrentUser(prisma = getPrismaClient()): Promise<UserProfile> {
  const session = await prisma.session.findFirst({
    include: { user: true },
    orderBy: { updatedAt: "desc" }
  });

  if (session) {
    return mapUser(session.user);
  }

  const fallbackUser = await prisma.user.findFirst({ orderBy: { id: "asc" } });

  if (!fallbackUser) {
    throw new Error("No users found in the configured Zipform database. Run the data seed first.");
  }

  return mapUser(fallbackUser);
}

async function loadTlozDataSet(prisma = getPrismaClient()): Promise<TlozDataSet> {
  const [
    users,
    seasons,
    episodes,
    projects,
    missions,
    missionDependencies,
    questItems,
    missionQuestItems,
    checklistItems,
    resources,
    userMissionStates
  ] = await Promise.all([
    prisma.user.findMany({ orderBy: { id: "asc" } }),
    prisma.tlozSeason.findMany({ orderBy: { startDate: "asc" } }),
    prisma.tlozEpisode.findMany({ orderBy: { startDate: "asc" } }),
    prisma.tlozProject.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.tlozMission.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.tlozMissionDependency.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.tlozQuestItem.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.tlozMissionQuestItem.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.tlozChecklistItem.findMany({ orderBy: [{ missionId: "asc" }, { position: "asc" }] }),
    prisma.tlozResource.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.tlozUserMissionState.findMany({ orderBy: { createdAt: "asc" } })
  ]);

  return {
    users: users.map(mapUser),
    seasons: seasons.map(mapSeason),
    episodes: episodes.map(mapEpisode),
    projects: projects.map(mapProject),
    missions: missions.map(mapMission),
    missionDependencies: missionDependencies.map(mapDependency),
    questItems: questItems.map(mapQuestItem),
    missionQuestItems: missionQuestItems.map(mapMissionQuestItem),
    checklistItems: checklistItems.map(mapChecklistItem),
    resources: resources.map(mapResource),
    userMissionStates: userMissionStates.map(mapUserMissionState)
  };
}

export function createPrismaDataClient(prisma: PrismaClient = getPrismaClient()): ZipformDataClient {
  const getHydratedMission = async (missionId: string) => {
    const mission = hydrateMissions(await loadTlozDataSet(prisma)).find((item) => item.id === missionId);
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
        return getCurrentUser(prisma);
      }
    },
    platform: {
      async getMetrics() {
        const rows = await prisma.platformMetric.findMany({ orderBy: { position: "asc" } });
        return rows.map(mapMetric);
      }
    },
    tloz: {
      async getDashboardSummary() {
        const [currentUser, tlozData] = await Promise.all([getCurrentUser(prisma), loadTlozDataSet(prisma)]);
        return buildTlozDashboardSummary(tlozData, currentUser.id);
      },
      async getMissions(filters = {}) {
        return hydrateMissions(await loadTlozDataSet(prisma)).filter((mission) =>
          (!filters.projectId || mission.projectId === filters.projectId) &&
          (!filters.seasonId || mission.seasonId === filters.seasonId) &&
          (!filters.episodeId || mission.episodeId === filters.episodeId) &&
          (!filters.ownerId || mission.ownerId === filters.ownerId)
        );
      },
      async getMissionDetail(missionId) {
        return buildTlozMissionDetail(await loadTlozDataSet(prisma), missionId);
      },
      async getProjects() {
        const rows = await prisma.tlozProject.findMany({ orderBy: { createdAt: "asc" } });
        return rows.map(mapProject);
      },
      async getSeasons() {
        const rows = await prisma.tlozSeason.findMany({ orderBy: { startDate: "asc" } });
        return rows.map(mapSeason);
      },
      async getEpisodes() {
        const rows = await prisma.tlozEpisode.findMany({ orderBy: { startDate: "asc" } });
        return rows.map(mapEpisode);
      },
      async getQuestItems() {
        const rows = await prisma.tlozQuestItem.findMany({ orderBy: { createdAt: "asc" } });
        return rows.map(mapQuestItem);
      },
      async getResources() {
        const rows = await prisma.tlozResource.findMany({ orderBy: { createdAt: "asc" } });
        return rows.map(mapResource);
      },
      async getUsers() {
        const rows = await prisma.user.findMany({ orderBy: { name: "asc" } });
        return rows.map(mapUser);
      },
      async createProject(input) {
        const valid = validateProjectCreate(input);
        const existing = await prisma.tlozProject.findMany({ select: { slug: true } });
        const row = await prisma.tlozProject.create({ data: { ...valid, id: crypto.randomUUID(), slug: uniqueSlug(valid.name, existing.map((item) => item.slug)), dueDate: valid.dueDate || null } });
        return mapProject(row);
      },
      async createQuestItem(input) {
        const valid = validateQuestItemCreate(input);
        const row = await prisma.tlozQuestItem.create({ data: { ...valid, id: crypto.randomUUID(), ownerId: valid.ownerId || null, acquiredAt: valid.acquiredAt || null } });
        return mapQuestItem(row);
      },
      async updateProject(projectId, input) {
        const row = await prisma.tlozProject.update({ where: { id: projectId }, data: { ...input, ...(Object.prototype.hasOwnProperty.call(input, "dueDate") ? { dueDate: input.dueDate || null } : {}) } });
        return mapProject(row);
      },
      async updateQuestItem(questItemId, input) {
        const row = await prisma.tlozQuestItem.update({ where: { id: questItemId }, data: { ...input, ...(Object.prototype.hasOwnProperty.call(input, "ownerId") ? { ownerId: input.ownerId || null } : {}), ...(Object.prototype.hasOwnProperty.call(input, "acquiredAt") ? { acquiredAt: input.acquiredAt || null } : {}) } });
        return mapQuestItem(row);
      },
      async createSeason(name) {
        const today = new Date().toISOString().slice(0, 10);
        const row = await prisma.tlozSeason.create({ data: { id: crypto.randomUUID(), name, version: name, description: "", status: "active", startDate: today } });
        return mapSeason(row);
      },
      async createEpisode(name, seasonId) {
        const today = new Date().toISOString().slice(0, 10);
        const count = await prisma.tlozEpisode.count({ where: { seasonId } });
        const row = await prisma.tlozEpisode.create({ data: { id: crypto.randomUUID(), seasonId, name, romanNumber: String(count + 1), description: "", status: "active", startDate: today } });
        return mapEpisode(row);
      },
      async createMission(input) {
        const valid = validateMissionCreate(input);
        const project = await prisma.tlozProject.findUnique({ where: { id: valid.projectId } });
        if (!project) throw new Error("TLOZ mission project was not found");
        const existing = await prisma.tlozMission.findMany({ select: { displayId: true } });
        const { id = crypto.randomUUID(), completedAt, ...data } = valid;
        await prisma.tlozMission.create({
          data: { ...data, id, displayId: nextMissionDisplayId(project.name, existing.map((item) => item.displayId)), completedAt: completedAt ? new Date(completedAt) : null }
        });
        return getHydratedMission(id);
      },
      async updateMission(missionId, input) {
        const { completedAt, ...data } = input;
        const nullableData = Object.fromEntries(Object.entries(data).map(([key, value]) => [
          key,
          value === "" && ["conclusion", "projectId", "seasonId", "episodeId", "dueDate", "startDate", "blockedReason"].includes(key) ? null : value
        ]));
        let nextDisplayId: string | undefined;
        if (input.projectId) {
          const current = await prisma.tlozMission.findUnique({ where: { id: missionId }, select: { projectId: true } });
          if (current?.projectId !== input.projectId) {
            const [project, existing] = await Promise.all([prisma.tlozProject.findUnique({ where: { id: input.projectId } }), prisma.tlozMission.findMany({ select: { displayId: true } })]);
            if (!project) throw new Error("TLOZ mission project was not found");
            nextDisplayId = nextMissionDisplayId(project.name, existing.map((item) => item.displayId));
          }
        }
        await prisma.tlozMission.update({
          where: { id: missionId },
          data: { ...nullableData, ...(nextDisplayId ? { displayId: nextDisplayId } : {}), ...(Object.prototype.hasOwnProperty.call(input, "completedAt")
            ? { completedAt: completedAt ? new Date(completedAt) : null }
            : {}) }
        });
        if (Object.prototype.hasOwnProperty.call(input, "projectId")) {
          await prisma.tlozMissionDependency.deleteMany({
            where: { OR: [{ missionId }, { dependsOnMissionId: missionId }] },
          });
        }
        return getHydratedMission(missionId);
      },
      async saveMissionDocument(missionId, markdown) {
        const items = parseMarkdownChecklist(markdown);
        const progress = items.length ? Math.round((items.filter((item) => item.completed).length / items.length) * 100) : 0;
        await prisma.$transaction([
          prisma.tlozMission.update({ where: { id: missionId }, data: { description: markdown, progress } }),
          prisma.tlozChecklistItem.deleteMany({ where: { missionId } }),
          ...items.map((item, position) => prisma.tlozChecklistItem.create({
            data: { id: crypto.randomUUID(), missionId, title: item.title, completed: item.completed, position }
          }))
        ]);
        const detail = await this.getMissionDetail(missionId);
        if (!detail) throw new Error(`TLOZ mission ${missionId} was not found`);
        return detail;
      },
      async addMissionDependency(missionId, dependsOnMissionId) {
        const [mission, dependency] = await Promise.all([
          prisma.tlozMission.findUnique({ where: { id: missionId }, select: { id: true, projectId: true } }),
          prisma.tlozMission.findUnique({ where: { id: dependsOnMissionId }, select: { id: true, projectId: true } }),
        ]);
        assertProjectScopedDependency(
          mission ? { id: mission.id, projectId: mission.projectId ?? undefined } : null,
          dependency ? { id: dependency.id, projectId: dependency.projectId ?? undefined } : null,
        );
        await prisma.tlozMissionDependency.upsert({
          where: { missionId_dependsOnMissionId: { missionId, dependsOnMissionId } },
          create: { id: crypto.randomUUID(), missionId, dependsOnMissionId },
          update: {}
        });
        return (await this.getMissionDetail(missionId))!;
      },
      async removeMissionDependency(missionId, dependsOnMissionId) {
        await prisma.tlozMissionDependency.deleteMany({ where: { missionId, dependsOnMissionId } });
        return (await this.getMissionDetail(missionId))!;
      },
      async setMissionQuestItem(missionId, questItemId, required) {
        await prisma.tlozMissionQuestItem.upsert({
          where: { missionId_questItemId: { missionId, questItemId } },
          create: { id: crypto.randomUUID(), missionId, questItemId, required },
          update: { required }
        });
        return (await this.getMissionDetail(missionId))!;
      },
      async removeMissionQuestItem(missionId, questItemId) {
        await prisma.tlozMissionQuestItem.deleteMany({ where: { missionId, questItemId } });
        return (await this.getMissionDetail(missionId))!;
      },
      async addMissionResource(missionId, input) {
        await prisma.tlozResource.create({ data: { id: crypto.randomUUID(), missionId, ...input } });
        return (await this.getMissionDetail(missionId))!;
      },
      async removeMissionResource(missionId, resourceId) {
        await prisma.tlozResource.deleteMany({ where: { id: resourceId, missionId } });
        return (await this.getMissionDetail(missionId))!;
      },
      async addProjectResource(projectId, input) {
        await prisma.tlozResource.create({ data: { id: crypto.randomUUID(), projectId, ...input } });
        return (await prisma.tlozResource.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } })).map(mapResource);
      },
      async removeProjectResource(projectId, resourceId) {
        await prisma.tlozResource.deleteMany({ where: { id: resourceId, projectId } });
        return (await prisma.tlozResource.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } })).map(mapResource);
      },
      async addQuestItemResource(questItemId, input) {
        await prisma.tlozResource.create({ data: { id: crypto.randomUUID(), questItemId, ...input } });
        return (await prisma.tlozResource.findMany({ where: { questItemId }, orderBy: { createdAt: "asc" } })).map(mapResource);
      },
      async removeQuestItemResource(questItemId, resourceId) {
        await prisma.tlozResource.deleteMany({ where: { id: resourceId, questItemId } });
        return (await prisma.tlozResource.findMany({ where: { questItemId }, orderBy: { createdAt: "asc" } })).map(mapResource);
      },
      async patchMissionStatus(missionId, status) {
        await prisma.tlozMission.update({
          where: { id: missionId },
          data: { status, completedAt: status === "completed" ? new Date() : null }
        });
        return getHydratedMission(missionId);
      },
      async deleteMission(missionId) {
        await prisma.tlozMission.delete({ where: { id: missionId } });
      }
    }
  };
}
