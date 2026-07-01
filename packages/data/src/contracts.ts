import type {
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
  displayId: string;
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

export type TlozMissionCreateInput = Omit<TlozMission, "id" | "createdAt" | "updatedAt" | "completedAt"> & {
  id?: string;
  completedAt?: string;
};

export type TlozMissionUpdateInput = Partial<
  Omit<TlozMission, "id" | "createdAt" | "updatedAt" | "ownerId" | "projectId">
> & {
  ownerId?: string;
  projectId?: string;
};

export type TlozMissionFilters = {
  projectId?: string;
  seasonId?: string;
  episodeId?: string;
  ownerId?: string;
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
  getProjects(): Promise<TlozProject[]>;
  getSeasons(): Promise<TlozSeason[]>;
  getEpisodes(): Promise<TlozEpisode[]>;
  getQuestItems(): Promise<TlozQuestItem[]>;
  getResources(): Promise<TlozResource[]>;
  createProject(name: string): Promise<TlozProject>;
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
  patchMissionStatus(missionId: string, status: TlozMission["status"]): Promise<TlozMissionRecord>;
  deleteMission(missionId: string): Promise<void>;
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
  };
  platform: {
    getMetrics(): Promise<PlatformMetric[]>;
  };
  tloz: TlozRepository;
};
