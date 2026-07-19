import { Prisma, PrismaClient } from "@prisma/client";
import type {
  ApiKey,
  Avatar,
  PlatformMetric,
  TlozChecklistItem,
  TlozEpisode,
  TlozMission,
  TlozMissionDependency,
  TlozMissionQuestItem,
  TlozAttachmentGroup,
  TlozProject,
  TlozQuestItem,
  TlozResource,
  TlozSeason,
  TlozUserMissionState,
  UserProfile
} from "@zipform/types";
import type { TlozAttachmentBatch, TlozAttachmentFileInput, TlozAttachmentFinalizeResult, TlozMissionRecord, ApiKeyCreateResult, AgentCreateInput } from "../contracts";
import { TlozAttachmentBatchSupersededError, TlozAttachmentError } from "../tloz-attachment-errors";
import type { PaginatedResult, PaginationInput, ProjectFilters, QuestItemFilters, ResourceFilters, TlozMissionFilters, UserFilters, ZipformDataClient } from "../contracts";
import { hashApiKey, verifyApiKey, generateApiKey } from "../lib/crypto";
import { apps, roadmap } from "../seed-data";
import {
  buildTlozDashboardSummary,
  buildTlozMissionDetail,
  hydrateMissions,
  parseMarkdownChecklist,
  type TlozDataSet
} from "../tloz-hydration";
import { assertAcyclicDependency, assertProjectScopedDependency } from "../dependency-rules";
import { slugify, validateMissionCreate, validateProjectCreate, validateQuestItemCreate } from "../tloz-validation";

const globalForPrisma = globalThis as typeof globalThis & {
  zipformPrisma?: PrismaClient;
};

export function getPrismaClient() {
  globalForPrisma.zipformPrisma ??= new PrismaClient();
  return globalForPrisma.zipformPrisma;
}

const UNIQUE_CONSTRAINT_CODE = "P2002";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === UNIQUE_CONSTRAINT_CODE
  );
}

function displayIdPrefix(projectName: string): string {
  return projectName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, "X");
}

function missionDocumentState(markdown: string) {
  const checklist = parseMarkdownChecklist(markdown);
  const completed = checklist.filter((item) => item.completed).length;
  return {
    checklist,
    progress: checklist.length ? Math.round((completed / checklist.length) * 100) : 0,
  };
}

async function replaceMissionChecklist(
  tx: Prisma.TransactionClient,
  missionId: string,
  checklist: ReturnType<typeof parseMarkdownChecklist>,
) {
  await tx.tlozChecklistItem.deleteMany({ where: { missionId } });
  await Promise.all(checklist.map((item, position) => tx.tlozChecklistItem.create({
    data: {
      id: crypto.randomUUID(),
      missionId,
      title: item.title,
      completed: item.completed,
      position,
    },
  })));
}

const toIso = (value: Date) => value.toISOString();

export function mapUser(user: {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  type: string;
  avatarUrl: string;
  theme?: string | null;
}): UserProfile {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    type: user.type as UserProfile["type"],
    avatarUrl: user.avatarUrl,
    theme: (user.theme ?? "system") as UserProfile["theme"],
  };
}

function mapApiKey(key: {
  id: string;
  userId: string;
  createdByUserId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ApiKey {
  return {
    id: key.id,
    userId: key.userId,
    createdByUserId: key.createdByUserId,
    name: key.name,
    keyPrefix: key.keyPrefix,
    lastUsedAt: key.lastUsedAt?.toISOString() ?? undefined,
    expiresAt: key.expiresAt?.toISOString() ?? undefined,
    createdAt: toIso(key.createdAt),
    updatedAt: toIso(key.updatedAt)
  };
}

function mapMetric(metric: { label: string; value: string; tone: string }): PlatformMetric {
  return {
    label: metric.label,
    value: metric.value,
    tone: metric.tone as PlatformMetric["tone"]
  };
}

function mapAvatar(avatar: { id: string; name: string; imageUrl: string }): Avatar {
  return {
    id: avatar.id,
    name: avatar.name,
    imageUrl: avatar.imageUrl
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
  descriptionDetail: string;
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
  descriptionDetail: string;
  icon: string;
  type: string;
  status: string;
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
  descriptionDetail: string;
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
  icon: string | null;
  title: string;
  url: string | null;
  fileId: string | null;
  groupKey: string | null;
  externalKey: string | null;
  storagePath: string | null;
  contentType: string | null;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  sourceRevision: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TlozResource {
  const { storagePath: _storagePath, ...publicResource } = resource;
  return {
    ...publicResource,
    type: publicResource.type as TlozResource["type"],
    icon: publicResource.icon ?? undefined,
    missionId: publicResource.missionId ?? undefined,
    projectId: publicResource.projectId ?? undefined,
    questItemId: publicResource.questItemId ?? undefined,
    url: publicResource.url ?? undefined,
    fileId: publicResource.fileId ?? undefined,
    groupKey: publicResource.groupKey ?? undefined,
    externalKey: publicResource.externalKey ?? undefined,
    contentType: publicResource.contentType ?? undefined,
    sizeBytes: publicResource.sizeBytes ?? undefined,
    width: publicResource.width ?? undefined,
    height: publicResource.height ?? undefined,
    sourceRevision: publicResource.sourceRevision ?? undefined,
    createdAt: toIso(publicResource.createdAt),
    updatedAt: toIso(publicResource.updatedAt)
  };
}

function attachmentFilesFromManifest(manifest: Prisma.JsonValue): TlozAttachmentFileInput[] {
  if (!Array.isArray(manifest)) throw new TlozAttachmentError("ATTACHMENT_CONFLICT", "El manifiesto de capturas persistido es inválido.");
  return manifest as unknown as TlozAttachmentFileInput[];
}

function mapAttachmentBatch(row: {
  id: string;
  missionId: string;
  groupKey: string;
  sourceRevision: string;
  generation: number;
  status: string;
  manifest: Prisma.JsonValue;
}): TlozAttachmentBatch {
  return {
    uploadBatchId: row.id,
    missionId: row.missionId,
    groupKey: row.groupKey,
    sourceRevision: row.sourceRevision,
    generation: row.generation,
    status: row.status as TlozAttachmentBatch["status"],
    files: attachmentFilesFromManifest(row.manifest),
  };
}

function mapAttachmentGroup(
  groupKey: string,
  sourceRevision: string,
  generation: number,
  resources: Array<Parameters<typeof mapResource>[0]>,
): TlozAttachmentGroup {
  return {
    groupKey,
    sourceRevision,
    generation,
    attachments: resources.map((resource) => {
      return { ...mapResource(resource), storagePath: resource.storagePath ?? undefined, url: "" };
    }),
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
      },
      async update(userId: string, input: import("../contracts").UserUpdateInput) {
        const row = await prisma.user.update({
          where: { id: userId },
          data: { ...input, updatedAt: new Date() }
        });
        return mapUser(row);
      }
    },
    platform: {
      async getMetrics() {
        const rows = await prisma.platformMetric.findMany({ orderBy: { position: "asc" } });
        return rows.map(mapMetric);
      },
      async listAvatars() {
        const rows = await prisma.avatar.findMany({ orderBy: { name: "asc" } });
        return rows.map(mapAvatar);
      }
    },
    agent: {
      async list() {
        const rows = await prisma.user.findMany({ where: { type: "agent" }, orderBy: { name: "asc" } });
        return rows.map(mapUser);
      },
      async create(input: AgentCreateInput, createdByUserId: string) {
        const id = crypto.randomUUID();
        const now = new Date();
        const user = await prisma.user.create({
          data: {
            id,
            name: input.name,
            username: input.username,
            email: input.email,
            role: input.role,
            type: "agent",
            avatarUrl: "",
            createdAt: now,
            updatedAt: now
          }
        });
        const apiKeyResult = await this.createApiKey(id, "default", createdByUserId);
        return { user: mapUser(user), apiKey: apiKeyResult };
      },
      async listApiKeys(userId: string) {
        const rows = await prisma.apiKey.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
        return rows.map(mapApiKey);
      },
      async createApiKey(userId: string, name: string, createdByUserId: string) {
        const rawKey = generateApiKey();
        const keyHash = hashApiKey(rawKey);
        const keyPrefix = rawKey.slice(0, 12);
        const now = new Date();
        const row = await prisma.apiKey.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            createdByUserId,
            name,
            keyPrefix,
            keyHash,
            createdAt: now,
            updatedAt: now
          }
        });
        return { key: rawKey, apiKey: mapApiKey(row) } satisfies ApiKeyCreateResult;
      },
      async revokeApiKey(keyId: string) {
        await prisma.apiKey.delete({ where: { id: keyId } });
      },
      async authenticateWithApiKey(key: string) {
        const rows = await prisma.apiKey.findMany();
        for (const row of rows) {
          if (verifyApiKey(key, row.keyHash)) {
            await prisma.apiKey.update({
              where: { id: row.id },
              data: { lastUsedAt: new Date() }
            });
            const user = await prisma.user.findUnique({ where: { id: row.userId } });
            return user ? mapUser(user) : null;
          }
        }
        return null;
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
      async findUsers(filters?: UserFilters, pagination?: PaginationInput): Promise<PaginatedResult<UserProfile>> {
        const limit = Math.min(pagination?.limit ?? 25, 100);
        const where: Record<string, unknown> = {};
        if (filters?.email) where.email = filters.email.toLowerCase();
        if (filters?.username) where.username = filters.username;
        const rows = await prisma.user.findMany({ where, orderBy: { name: "asc" }, take: limit + 1 });
        const data = rows.slice(0, limit).map(mapUser);
        const nextCursor = rows.length > limit ? String(rows[limit - 1]?.id ?? "") : null;
        return { data, nextCursor };
      },
      async findProjects(filters?: ProjectFilters, pagination?: PaginationInput): Promise<PaginatedResult<TlozProject>> {
        const limit = Math.min(pagination?.limit ?? 25, 100);
        const where: Record<string, unknown> = {};
        if (filters?.ownerId) where.ownerId = filters.ownerId;
        if (filters?.status) where.status = filters.status;
        const rows = await prisma.tlozProject.findMany({ where, orderBy: { createdAt: "asc" }, take: limit + 1 });
        const data = rows.slice(0, limit).map(mapProject);
        const nextCursor = rows.length > limit ? String(rows[limit - 1]?.id ?? "") : null;
        return { data, nextCursor };
      },
      async findMissions(filters?: TlozMissionFilters, pagination?: PaginationInput): Promise<PaginatedResult<TlozMissionRecord>> {
        const limit = Math.min(pagination?.limit ?? 25, 100);
        const hydrated = hydrateMissions(await loadTlozDataSet(prisma));
        const filtered = hydrated.filter((mission) =>
          (!filters?.projectId || mission.projectId === filters.projectId) &&
          (!filters?.seasonId || mission.seasonId === filters.seasonId) &&
          (!filters?.episodeId || mission.episodeId === filters.episodeId) &&
          (!filters?.ownerId || mission.ownerId === filters.ownerId) &&
          (!filters?.status || mission.status === filters.status) &&
          (!filters?.title || mission.title.toLowerCase().includes(filters.title.toLowerCase()))
        );
        const data = filtered.slice(0, limit);
        return { data, nextCursor: filtered.length > limit ? data[data.length - 1]?.id ?? null : null };
      },
      async findQuestItems(filters?: QuestItemFilters, pagination?: PaginationInput): Promise<PaginatedResult<TlozQuestItem>> {
        const limit = Math.min(pagination?.limit ?? 25, 100);
        const where: Record<string, unknown> = {};
        if (filters?.ownerId) where.ownerId = filters.ownerId;
        if (filters?.status) where.status = filters.status;
        if (filters?.category) where.category = filters.category;
        const rows = await prisma.tlozQuestItem.findMany({ where, orderBy: { createdAt: "asc" }, take: limit + 1 });
        const data = rows.slice(0, limit).map(mapQuestItem);
        const nextCursor = rows.length > limit ? String(rows[limit - 1]?.id ?? "") : null;
        return { data, nextCursor };
      },
      async findResources(filters?: ResourceFilters, pagination?: PaginationInput): Promise<PaginatedResult<TlozResource>> {
        const limit = Math.min(pagination?.limit ?? 25, 100);
        const where: Record<string, unknown> = {};
        if (filters?.missionId) where.missionId = filters.missionId;
        if (filters?.projectId) where.projectId = filters.projectId;
        if (filters?.questItemId) where.questItemId = filters.questItemId;
        if (filters?.type) where.type = filters.type;
        const rows = await prisma.tlozResource.findMany({ where, orderBy: { createdAt: "asc" }, take: limit + 1 });
        const data = rows.slice(0, limit).map(mapResource);
        const nextCursor = rows.length > limit ? String(rows[limit - 1]?.id ?? "") : null;
        return { data, nextCursor };
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
        const base = slugify(valid.name);
        let candidate = base;
        let suffix = 2;
        for (let i = 0; i < 20; i++) {
          try {
            const row = await prisma.tlozProject.create({
              data: { ...valid, id: crypto.randomUUID(), slug: candidate, dueDate: valid.dueDate || null }
            });
            return mapProject(row);
          } catch (error) {
            if (isUniqueConstraintError(error)) {
              candidate = `${base}-${suffix++}`;
              continue;
            }
            throw error;
          }
        }
        throw new Error("Could not create project with unique slug after 20 attempts");
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
        const prefix = displayIdPrefix(project.name);
        let suffix = 1;
        for (let i = 0; i < 20; i++) {
          try {
            if (i === 0) {
              const existing = await prisma.tlozMission.findMany({
                where: { displayId: { startsWith: `${prefix}-` } },
                select: { displayId: true }
              });
              suffix = existing.reduce((max, m) => Math.max(max, Number(m.displayId.slice(4)) || 0), 0) + 1;
            }
            const displayId = `${prefix}-${String(suffix).padStart(4, "0")}`;
            const { id = crypto.randomUUID(), completedAt, dependencyIds: _dependencyIds, requiredQuestItemIds: _requiredQuestItemIds, resources: _resources, ...data } = valid;
            const checklist = parseMarkdownChecklist(data.descriptionDetail);
            const progress = checklist.length
              ? Math.round((checklist.filter((item) => item.completed).length / checklist.length) * 100)
              : data.progress;
            const now = new Date();
            await prisma.$transaction(async (tx) => {
              await tx.tlozMission.create({
                data: { ...data, id, displayId, progress, completedAt: completedAt ? new Date(completedAt) : null }
              });
              await Promise.all(checklist.map((item, position) => tx.tlozChecklistItem.create({
                data: {
                  id: crypto.randomUUID(),
                  missionId: id,
                  title: item.title,
                  completed: item.completed,
                  position,
                  createdAt: now,
                  updatedAt: now,
                },
              })));
              const dependencyIds = input.dependencyIds ?? [];
              const requiredQuestItemIds = input.requiredQuestItemIds ?? [];
              const resourceInputs = input.resources ?? [];
              const dependencies = dependencyIds.length ? await tx.tlozMission.findMany({ where: { id: { in: dependencyIds } }, select: { id: true, projectId: true } }) : [];
              if (dependencies.length !== dependencyIds.length) throw new Error("A mission dependency was not found");
              dependencies.forEach((dependency) => assertProjectScopedDependency({ id, projectId: valid.projectId }, { id: dependency.id, projectId: dependency.projectId ?? undefined }));
              const questItems = requiredQuestItemIds.length ? await tx.tlozQuestItem.findMany({ where: { id: { in: requiredQuestItemIds } }, select: { id: true } }) : [];
              if (questItems.length !== requiredQuestItemIds.length) throw new Error("A required Quest Item was not found");
              if (resourceInputs.some((resource) => !resource.title.trim() || !resource.type)) throw new Error("Mission resources require a type and title");
              await Promise.all(dependencyIds.map((dependsOnMissionId) => tx.tlozMissionDependency.create({ data: { id: crypto.randomUUID(), missionId: id, dependsOnMissionId } })));
              await Promise.all(requiredQuestItemIds.map((questItemId) => tx.tlozMissionQuestItem.create({ data: { id: crypto.randomUUID(), missionId: id, questItemId, required: true } })));
              await Promise.all(resourceInputs.map((resource) => tx.tlozResource.create({ data: { id: crypto.randomUUID(), missionId: id, ...resource } })));
            });
            return getHydratedMission(id);
          } catch (error) {
            if (isUniqueConstraintError(error)) {
              suffix++;
              continue;
            }
            throw error;
          }
        }
        throw new Error("Could not create mission with unique display ID after 20 attempts");
      },
      async updateMission(missionId, input) {
        const { completedAt, ...data } = input;
        const nullableData = Object.fromEntries(Object.entries(data).map(([key, value]) => [
          key,
          value === "" && ["projectId", "seasonId", "episodeId", "dueDate", "startDate", "blockedReason"].includes(key) ? null : value
        ]));
        const document = typeof input.descriptionDetail === "string"
          ? missionDocumentState(input.descriptionDetail)
          : null;
        if (document) nullableData.progress = document.progress;
        const projectChanged = input.projectId !== undefined;

        await prisma.$transaction(async (tx) => {
          if (projectChanged) {
            const current = await tx.tlozMission.findUnique({
              where: { id: missionId },
              select: { projectId: true }
            });
            if (current?.projectId !== input.projectId) {
              const project = await tx.tlozProject.findUnique({ where: { id: input.projectId! } });
              if (!project) throw new Error("TLOZ mission project was not found");
              const prefix = displayIdPrefix(project.name);
              let displaySuffix = 1;
              for (let i = 0; i < 20; i++) {
                try {
                  if (i === 0) {
                    const existing = await tx.tlozMission.findMany({
                      where: { displayId: { startsWith: `${prefix}-` } },
                      select: { displayId: true }
                    });
                    displaySuffix = existing.reduce((max, m) => Math.max(max, Number(m.displayId.slice(4)) || 0), 0) + 1;
                  }
                  const nextDisplayId = `${prefix}-${String(displaySuffix).padStart(4, "0")}`;
                  const updateData: Record<string, unknown> = {
                    ...nullableData,
                    displayId: nextDisplayId
                  };
                  if (Object.prototype.hasOwnProperty.call(input, "completedAt")) {
                    updateData.completedAt = completedAt ? new Date(completedAt) : null;
                  }
                  await tx.tlozMission.update({
                    where: { id: missionId },
                    data: updateData
                  });
                  if (document) await replaceMissionChecklist(tx, missionId, document.checklist);
                  await tx.tlozMissionDependency.deleteMany({
                    where: { OR: [{ missionId }, { dependsOnMissionId: missionId }] },
                  });
                  return;
                } catch (error) {
                  if (isUniqueConstraintError(error)) {
                    displaySuffix++;
                    continue;
                  }
                  throw error;
                }
              }
              throw new Error("Could not update mission with unique display ID after 20 attempts");
            }
          }

          const updateData: Record<string, unknown> = { ...nullableData };
          if (Object.prototype.hasOwnProperty.call(input, "completedAt")) {
            updateData.completedAt = completedAt ? new Date(completedAt) : null;
          }
          await tx.tlozMission.update({
            where: { id: missionId },
            data: updateData
          });
          if (document) await replaceMissionChecklist(tx, missionId, document.checklist);

          if (projectChanged) {
            await tx.tlozMissionDependency.deleteMany({
              where: { OR: [{ missionId }, { dependsOnMissionId: missionId }] },
            });
          }
        });
        return getHydratedMission(missionId);
      },
      async saveMissionDocument(missionId, markdown) {
        const document = missionDocumentState(markdown);
        await prisma.$transaction(async (tx) => {
          await tx.tlozMission.update({
            where: { id: missionId },
            data: { descriptionDetail: markdown, progress: document.progress },
          });
          await replaceMissionChecklist(tx, missionId, document.checklist);
        });
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
        const edges = await prisma.tlozMissionDependency.findMany({ select: { missionId: true, dependsOnMissionId: true } });
        assertAcyclicDependency(missionId, dependsOnMissionId, edges.map((edge) => ({ id: edge.missionId, dependsOnMissionId: edge.dependsOnMissionId })));
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
      async prepareAttachmentBatch(missionId, groupKey, sourceRevision, files) {
        const existing = await prisma.tlozAttachmentBatch.findUnique({
          where: { missionId_groupKey_sourceRevision: { missionId, groupKey, sourceRevision } },
        });
        if (existing) return mapAttachmentBatch(existing);

        const mission = await prisma.tlozMission.findUnique({ where: { id: missionId }, select: { id: true } });
        if (!mission) throw new TlozAttachmentError("ATTACHMENT_MISSION_NOT_FOUND", `TLOZ mission ${missionId} was not found`);
        const latest = await prisma.tlozAttachmentBatch.findFirst({
          where: { missionId, groupKey },
          orderBy: { generation: "desc" },
          select: { generation: true },
        });
        const row = await prisma.tlozAttachmentBatch.create({
          data: {
            id: crypto.randomUUID(),
            missionId,
            groupKey,
            sourceRevision,
            generation: (latest?.generation ?? 0) + 1,
            status: "prepared",
            manifest: files as unknown as Prisma.InputJsonValue,
          },
        });
        return mapAttachmentBatch(row);
      },
      async getAttachmentBatch(uploadBatchId) {
        const row = await prisma.tlozAttachmentBatch.findUnique({ where: { id: uploadBatchId } });
        if (!row) throw new TlozAttachmentError("ATTACHMENT_BATCH_NOT_FOUND", "El lote de capturas no existe.");
        return mapAttachmentBatch(row);
      },
      async finalizeAttachmentBatch(uploadBatchId) {
        const batch = await prisma.tlozAttachmentBatch.findUnique({ where: { id: uploadBatchId } });
        if (!batch) throw new TlozAttachmentError("ATTACHMENT_BATCH_NOT_FOUND", "El lote de capturas no existe.");
        const mappedBatch = mapAttachmentBatch(batch);

        if (batch.status !== "finalized") {
          const finalized = await prisma.$transaction(async (tx) => {
            const latest = await tx.tlozAttachmentBatch.findFirst({
              where: { missionId: batch.missionId, groupKey: batch.groupKey },
              orderBy: { generation: "desc" },
              select: { id: true },
            });
            if (latest?.id !== batch.id) throw new TlozAttachmentBatchSupersededError();

            const current = await tx.tlozResource.findMany({
              where: { missionId: batch.missionId, groupKey: batch.groupKey },
              orderBy: { createdAt: "asc" },
            });
            const files = mappedBatch.files;
            const keys = files.map((file) => file.key);
            const previousStoragePaths = current
              .filter((resource) => !keys.includes(resource.externalKey ?? "") || files.some((file) => file.key === resource.externalKey && file.storagePath !== resource.storagePath))
              .map((resource) => resource.storagePath)
              .filter((path): path is string => Boolean(path));
            const currentByKey = new Map(current.map((resource) => [resource.externalKey, resource]));

            for (const file of files) {
              const existing = currentByKey.get(file.key);
              const data = {
                type: "image",
                title: file.title,
                url: null,
                fileId: null,
                groupKey: batch.groupKey,
                externalKey: file.key,
                storagePath: file.storagePath,
                contentType: file.contentType,
                sizeBytes: file.sizeBytes,
                width: file.width,
                height: file.height,
                sourceRevision: batch.sourceRevision,
              };
              if (existing) await tx.tlozResource.update({ where: { id: existing.id }, data });
              else await tx.tlozResource.create({ data: { id: crypto.randomUUID(), missionId: batch.missionId, ...data } });
            }
            await tx.tlozResource.deleteMany({
              where: { missionId: batch.missionId, groupKey: batch.groupKey, externalKey: { notIn: keys } },
            });
            const updated = await tx.tlozResource.findMany({
              where: { missionId: batch.missionId, groupKey: batch.groupKey },
              orderBy: { createdAt: "asc" },
            });
            const updatedBatch = await tx.tlozAttachmentBatch.update({
              where: { id: batch.id },
              data: { status: "finalized", finalizedAt: new Date() },
            });
            return { updatedBatch, updated, previousStoragePaths };
          }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
          return {
            batch: mapAttachmentBatch(finalized.updatedBatch),
            group: mapAttachmentGroup(batch.groupKey, batch.sourceRevision, batch.generation, finalized.updated),
            previousStoragePaths: [...new Set(finalized.previousStoragePaths)],
          } satisfies TlozAttachmentFinalizeResult;
        }

        const resources = await prisma.tlozResource.findMany({
          where: { missionId: batch.missionId, groupKey: batch.groupKey },
          orderBy: { createdAt: "asc" },
        });
        return {
          batch: mappedBatch,
          group: mapAttachmentGroup(batch.groupKey, batch.sourceRevision, batch.generation, resources),
          previousStoragePaths: [],
        } satisfies TlozAttachmentFinalizeResult;
      },
      async getAttachmentGroups(missionId) {
        const [resources, batches] = await Promise.all([
          prisma.tlozResource.findMany({ where: { missionId, groupKey: { not: null }, sourceRevision: { not: null } }, orderBy: { createdAt: "asc" } }),
          prisma.tlozAttachmentBatch.findMany({ where: { missionId, status: "finalized" }, orderBy: { generation: "desc" } }),
        ]);
        const latestByGroup = new Map<string, (typeof batches)[number]>();
        for (const batch of batches) if (!latestByGroup.has(batch.groupKey)) latestByGroup.set(batch.groupKey, batch);
        const resourcesByGroup = new Map<string, typeof resources>();
        for (const resource of resources) {
          if (!resource.groupKey) continue;
          const group = resourcesByGroup.get(resource.groupKey) ?? [];
          group.push(resource);
          resourcesByGroup.set(resource.groupKey, group);
        }
        return [...resourcesByGroup.entries()].flatMap(([groupKey, groupResources]) => {
          const batch = latestByGroup.get(groupKey);
          return batch ? [mapAttachmentGroup(groupKey, batch.sourceRevision, batch.generation, groupResources)] : [];
        });
      },
      async patchMissionStatus(missionId, status) {
        await prisma.tlozMission.update({
          where: { id: missionId },
          data: { status, completedAt: status === "completed" ? new Date() : null }
        });
        return getHydratedMission(missionId);
      },
      async deleteMission(missionId) {
        await prisma.$transaction([
          prisma.tlozUserMissionState.deleteMany({ where: { missionId } }),
          prisma.tlozResource.deleteMany({ where: { missionId } }),
          prisma.tlozChecklistItem.deleteMany({ where: { missionId } }),
          prisma.tlozMissionQuestItem.deleteMany({ where: { missionId } }),
          prisma.tlozMissionDependency.deleteMany({
            where: { OR: [{ missionId }, { dependsOnMissionId: missionId }] }
          }),
          prisma.tlozMission.delete({ where: { id: missionId } }),
        ]);
      }
    }
  };
}
