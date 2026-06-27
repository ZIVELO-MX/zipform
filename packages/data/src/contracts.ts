import type {
  AppModule,
  PlatformMetric,
  RoadmapSnapshot,
  TlozChecklistItem,
  TlozEpisode,
  TlozMission,
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
  project: TlozProject;
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
  getMissions(): Promise<TlozMissionRecord[]>;
  getMissionDetail(missionId: string): Promise<TlozMissionDetail | null>;
  getProjects(): Promise<TlozProject[]>;
  getSeasons(): Promise<TlozSeason[]>;
  getEpisodes(): Promise<TlozEpisode[]>;
  getQuestItems(): Promise<TlozQuestItem[]>;
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
