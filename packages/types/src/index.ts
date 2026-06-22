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

export type UserProfile = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  avatarUrl: string;
};

export type PlatformMetric = {
  label: string;
  value: string;
  tone: "good" | "warning" | "neutral";
};
