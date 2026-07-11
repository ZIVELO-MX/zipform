import type {
  ApiKey,
  AppModule,
  PlatformMetric,
  RoadmapSnapshot,
  TlozChecklistItem,
  TlozEpisode,
  TlozMission,
  TlozMissionQuestItem,
  TlozProject,
  TlozQuestItem,
  TlozResource,
  TlozSeason,
  UserProfile
} from "@zipform/types";

export type DataDriver = "mock" | "prisma";

export type DataClientOptions = {
  driver?: DataDriver;
};

export type TlozMissionRecord = TlozMission & {
  project?: TlozProject;
  season?: TlozSeason;
  episode?: TlozEpisode;
  dependencies: TlozMission[];
  questItems: TlozQuestItem[];
  requiredQuestItems: TlozQuestItem[];
  owner: UserProfile;
};

export type TlozMissionDetail = TlozMissionRecord & {
  checklist: TlozChecklistItem[];
  resources: TlozResource[];
  requiredBy: TlozMission[];
  missionQuestItems: TlozMissionQuestItem[];
};

export type TlozResourceInput = Pick<TlozResource, "type" | "title"> &
  Partial<Pick<TlozResource, "url" | "fileId">>;

export type UserUpdateInput = {
  name?: string;
  username?: string;
  theme?: UserProfile["theme"];
  avatarUrl?: string;
};

type TlozMissionCreateOptional = Omit<
  TlozMission,
  "id" | "displayId" | "createdAt" | "updatedAt" | "completedAt" | "title" | "type" | "ownerId" | "projectId"
>;

export type TlozMissionCreateInput = Pick<TlozMission, "title" | "type" | "ownerId"> &
  Partial<TlozMissionCreateOptional> & {
    projectId: string;
    id?: string;
    completedAt?: string;
  };

export type TlozProjectCreateInput = Omit<TlozProject, "id" | "slug" | "createdAt" | "updatedAt" | "descriptionDetail"> & { descriptionDetail?: string };
export type TlozQuestItemCreateInput = Omit<TlozQuestItem, "id" | "createdAt" | "updatedAt" | "acquiredAt" | "descriptionDetail"> & { descriptionDetail?: string; acquiredAt?: string };

export type TlozMissionUpdateInput = Partial<
  Omit<TlozMission, "id" | "createdAt" | "updatedAt" | "ownerId" | "projectId">
> & {
  ownerId?: string;
  projectId?: string;
};

export type TlozProjectUpdateInput = Partial<Pick<TlozProject, "name" | "description" | "descriptionDetail" | "icon" | "color" | "status" | "type" | "ownerId" | "startDate" | "dueDate">>;
export type TlozQuestItemUpdateInput = Partial<Pick<TlozQuestItem, "name" | "description" | "descriptionDetail" | "icon" | "status" | "category" | "ownerId" | "acquiredAt">>;

export type PaginatedResult<T> = {
  data: T[];
  nextCursor: string | null;
};

export type UserFilters = {
  email?: string;
  username?: string;
};

export type ProjectFilters = {
  ownerId?: string;
  status?: TlozProject["status"];
};

export type PaginationInput = {
  limit?: number;
  cursor?: string;
};

export type TlozMissionFilters = {
  projectId?: string;
  seasonId?: string;
  episodeId?: string;
  ownerId?: string;
  status?: TlozMission["status"];
  title?: string;
};

export type QuestItemFilters = {
  ownerId?: string;
  status?: TlozQuestItem["status"];
  category?: TlozQuestItem["category"];
};

export type ResourceFilters = {
  missionId?: string;
  projectId?: string;
  questItemId?: string;
  type?: TlozResource["type"];
};

export type TlozDashboardSummary = {
  activeQuest: TlozMissionRecord | null;
  activeSupportQuest: TlozMissionRecord | null;
  nowMissions: TlozMissionRecord[];
  mainQuests: TlozMissionRecord[];
  upcomingMissions: TlozMissionRecord[];
  futureMissions: TlozMissionRecord[];
  projects: Array<TlozProject & { totalMissions: number; nowMissions: number; completedMissions: number }>;
  recentActivity: Array<{ user: string; action: string; target: string; time: string; dotColor: string }>;
  questItems: TlozQuestItem[];
};

export type TlozRepository = {
  getDashboardSummary(): Promise<TlozDashboardSummary>;
  getMissions(filters?: TlozMissionFilters): Promise<TlozMissionRecord[]>;
  getMissionDetail(missionId: string): Promise<TlozMissionDetail | null>;
  findUsers(filters?: UserFilters, pagination?: PaginationInput): Promise<PaginatedResult<UserProfile>>;
  findProjects(filters?: ProjectFilters, pagination?: PaginationInput): Promise<PaginatedResult<TlozProject>>;
  findMissions(filters?: TlozMissionFilters, pagination?: PaginationInput): Promise<PaginatedResult<TlozMissionRecord>>;
  findQuestItems(filters?: QuestItemFilters, pagination?: PaginationInput): Promise<PaginatedResult<TlozQuestItem>>;
  findResources(filters?: ResourceFilters, pagination?: PaginationInput): Promise<PaginatedResult<TlozResource>>;
  getProjects(): Promise<TlozProject[]>;
  getSeasons(): Promise<TlozSeason[]>;
  getEpisodes(): Promise<TlozEpisode[]>;
  getQuestItems(): Promise<TlozQuestItem[]>;
  getResources(): Promise<TlozResource[]>;
  getUsers(): Promise<UserProfile[]>;
  createProject(input: TlozProjectCreateInput): Promise<TlozProject>;
  createQuestItem(input: TlozQuestItemCreateInput): Promise<TlozQuestItem>;
  updateProject(projectId: string, input: TlozProjectUpdateInput): Promise<TlozProject>;
  updateQuestItem(questItemId: string, input: TlozQuestItemUpdateInput): Promise<TlozQuestItem>;
  createSeason(name: string): Promise<TlozSeason>;
  createEpisode(name: string, seasonId: string): Promise<TlozEpisode>;
  createMission(input: TlozMissionCreateInput): Promise<TlozMissionRecord>;
  updateMission(missionId: string, input: TlozMissionUpdateInput): Promise<TlozMissionRecord>;
  saveMissionDocument(missionId: string, markdown: string): Promise<TlozMissionDetail>;
  addMissionDependency(missionId: string, dependsOnMissionId: string): Promise<TlozMissionDetail>;
  removeMissionDependency(missionId: string, dependsOnMissionId: string): Promise<TlozMissionDetail>;
  setMissionQuestItem(missionId: string, questItemId: string, required: boolean): Promise<TlozMissionDetail>;
  removeMissionQuestItem(missionId: string, questItemId: string): Promise<TlozMissionDetail>;
  addMissionResource(missionId: string, input: TlozResourceInput): Promise<TlozMissionDetail>;
  removeMissionResource(missionId: string, resourceId: string): Promise<TlozMissionDetail>;
  addProjectResource(projectId: string, input: TlozResourceInput): Promise<TlozResource[]>;
  removeProjectResource(projectId: string, resourceId: string): Promise<TlozResource[]>;
  addQuestItemResource(questItemId: string, input: TlozResourceInput): Promise<TlozResource[]>;
  removeQuestItemResource(questItemId: string, resourceId: string): Promise<TlozResource[]>;
  patchMissionStatus(missionId: string, status: TlozMission["status"]): Promise<TlozMissionRecord>;
  deleteMission(missionId: string): Promise<void>;
};

export type AgentCreateInput = {
  name: string;
  username: string;
  email: string;
  role: string;
};

export type ApiKeyCreateResult = {
  key: string;
  apiKey: ApiKey;
};

export type ZipformDataClient = {
  apps: {
    list(): Promise<AppModule[]>;
    getById(id: string): Promise<AppModule | null>;
  };
  roadmap: {
    getSnapshot(): Promise<RoadmapSnapshot>;
  };
  user: {
    getCurrent(): Promise<UserProfile>;
    update(userId: string, input: UserUpdateInput): Promise<UserProfile>;
  };
  platform: {
    getMetrics(): Promise<PlatformMetric[]>;
  };
  agent: {
    list(): Promise<UserProfile[]>;
    create(input: AgentCreateInput, createdByUserId: string): Promise<{ user: UserProfile; apiKey: ApiKeyCreateResult }>;
    listApiKeys(userId: string): Promise<ApiKey[]>;
    createApiKey(userId: string, name: string, createdByUserId: string): Promise<ApiKeyCreateResult>;
    revokeApiKey(keyId: string): Promise<void>;
    authenticateWithApiKey(key: string): Promise<UserProfile | null>;
  };
  tloz: TlozRepository;
};
