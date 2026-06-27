import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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
  type TlozDataSet
} from "../tloz-hydration";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

process.env.DATABASE_URL ??= `file:${resolve(packageRoot, "dev.db")}`;

const globalForPrisma = globalThis as typeof globalThis & {
  zipformPrisma?: PrismaClient;
};

function getPrismaClient() {
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
  name: string;
  description: string;
  color: string;
  icon: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): TlozProject {
  return {
    ...project,
    status: project.status as TlozProject["status"],
    createdAt: toIso(project.createdAt),
    updatedAt: toIso(project.updatedAt)
  };
}

function mapMission(mission: {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: string;
  status: string;
  conclusion: string | null;
  ownerId: string;
  projectId: string;
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
  acquiredAt: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TlozQuestItem {
  return {
    ...item,
    status: item.status as TlozQuestItem["status"],
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
  missionId: string;
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

export function createPrismaDataClient(): ZipformDataClient {
  const prisma = getPrismaClient();

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
      async getMissions() {
        return hydrateMissions(await loadTlozDataSet(prisma));
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
      }
    }
  };
}
