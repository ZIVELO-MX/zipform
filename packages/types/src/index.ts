export type AppStatus = "enabled" | "planned" | "external";

export type RoadmapLane = "NOW" | "NEXT" | "LATER";

export type AppModule = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  href: string;
  status: AppStatus;
  versionTarget?: string;
  owner: "platform" | "quotes" | "tloz";
};

export type RoadmapTask = {
  id: string;
  lane: RoadmapLane;
  category?: string;
  label: string;
  app: "PLATFORM" | "QUOTES" | "TLOZ" | "DOCUMENTATION" | "UI" | "AUTH";
  human?: boolean;
  dependsOn?: string[];
};

export type RoadmapSnapshot = {
  currentVersion: string;
  targetVersion: string;
  now: RoadmapTask[];
  next: RoadmapTask[];
  later: RoadmapTask[];
};

export type UserType = "human" | "agent";

export type UserProfile = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  type: UserType;
  avatarUrl: string;
  theme: "system" | "light" | "dark";
};

export type ApiKey = {
  id: string;
  userId: string;
  createdByUserId: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PlatformMetric = {
  label: string;
  value: string;
  tone: "good" | "warning" | "neutral";
};

export type TlozEntityStatus = "planned" | "active" | "completed" | "blocked" | "archived";
export type TlozProjectStatus = "planned" | "active" | "archived";
export type TlozProjectType = "normal" | "system";
export type TlozInventoryStatus = "locked" | "unlocked";
export type TlozInventoryCategory = "tool" | "access" | "asset" | "document" | "other";

export type Avatar = {
  id: string;
  name: string;
  imageUrl: string;
};

export type TlozMissionType =
  | "main_quest"
  | "side_quest"
  | "farming_quest"
  | "exploration_quest";

export type TlozMissionStatus = "now" | "next" | "later" | "completed" | "blocked";

export type TlozResourceType = "link" | "document" | "image" | "file" | "note";

export type TlozUserMissionSlot = "active_quest" | "support_quest";

export type TlozSeason = {
  id: string;
  name: string;
  version: string;
  description: string;
  status: TlozEntityStatus;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type TlozEpisode = {
  id: string;
  seasonId: string;
  name: string;
  romanNumber: string;
  description: string;
  status: TlozEntityStatus;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type TlozProject = {
  id: string;
  slug: string;
  name: string;
  description: string;
  descriptionDetail: string;
  color: string;
  icon: string;
  status: TlozProjectStatus;
  type: TlozProjectType;
  ownerId: string;
  startDate: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type TlozMission = {
  id: string;
  displayId: string;
  title: string;
  description: string;
  descriptionDetail: string;
  icon: string;
  type: TlozMissionType;
  status: TlozMissionStatus;
  ownerId: string;
  projectId?: string;
  seasonId?: string;
  episodeId?: string;
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  blockedReason?: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
};

export type TlozMissionDependency = {
  id: string;
  missionId: string;
  dependsOnMissionId: string;
  createdAt: string;
};

export type TlozQuestItem = {
  id: string;
  name: string;
  description: string;
  descriptionDetail: string;
  icon: string;
  status: TlozInventoryStatus;
  category: TlozInventoryCategory;
  ownerId?: string;
  acquiredAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type TlozMissionQuestItem = {
  id: string;
  missionId: string;
  questItemId: string;
  required: boolean;
  createdAt: string;
};

export type TlozChecklistItem = {
  id: string;
  missionId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type TlozResource = {
  id: string;
  missionId?: string;
  projectId?: string;
  questItemId?: string;
  type: TlozResourceType;
  icon?: string;
  title: string;
  url?: string;
  fileId?: string;
  createdAt: string;
  updatedAt: string;
};

export type TlozUserMissionState = {
  id: string;
  userId: string;
  missionId: string;
  slot: TlozUserMissionSlot;
  createdAt: string;
  updatedAt: string;
};
