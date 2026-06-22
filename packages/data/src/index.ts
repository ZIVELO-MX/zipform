import type {
  AppModule,
  PlatformMetric,
  RoadmapSnapshot,
  UserProfile
} from "@zipform/types";

export type DataDriver = "mock";

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
};

const apps: AppModule[] = [
  {
    id: "quotes",
    name: "Quotes",
    shortName: "Quotes",
    description:
      "Quote workflow entry point. The product exists, but this section is a platform placeholder until integration work starts.",
    href: "/quotes",
    status: "external",
    versionTarget: "1.0",
    owner: "quotes"
  },
  {
    id: "tloz",
    name: "TLOZ",
    shortName: "TLOZ",
    description:
      "The Legend of Zivelo platform entry. This dashboard only exposes platform support and does not implement TLOZ product logic.",
    href: "/tloz",
    status: "enabled",
    versionTarget: "1.0",
    owner: "tloz"
  },
  {
    id: "finance",
    name: "Finance",
    shortName: "Finance",
    description: "Future internal finance workflows for the Zipform ecosystem.",
    href: "/roadmap",
    status: "planned",
    owner: "platform"
  },
  {
    id: "security",
    name: "Security",
    shortName: "Security",
    description: "Future internal controls, permissions, and security review surface.",
    href: "/roadmap",
    status: "planned",
    owner: "platform"
  }
];

const roadmap: RoadmapSnapshot = {
  currentVersion: "0.1",
  targetVersion: "1.0",
  now: [
    {
      id: "platform-dashboard-shell",
      lane: "NOW",
      app: "PLATFORM",
      label: "Build functional dashboard shell with responsive sidebar"
    },
    {
      id: "platform-mock-data",
      lane: "NOW",
      app: "PLATFORM",
      label: "Create mock data modules that can be replaced by a real DB driver"
    },
    {
      id: "documentation-roadmap",
      lane: "NOW",
      app: "DOCUMENTATION",
      label: "Create ROADMAP.md and keep README synchronized"
    }
  ],
  next: [
    {
      id: "auth-foundation",
      lane: "NEXT",
      category: "Authentication",
      app: "AUTH",
      label: "Enable shared internal authentication"
    },
    {
      id: "quotes-integration",
      lane: "NEXT",
      category: "Quotes",
      app: "QUOTES",
      label: "Prepare Quotes integration path for daily-use readiness",
      dependsOn: ["auth-foundation"]
    },
    {
      id: "tloz-platform-support",
      lane: "NEXT",
      category: "TLOZ",
      app: "TLOZ",
      label: "Support TLOZ with navigation, shared UI, auth, and deployment foundations",
      dependsOn: ["auth-foundation"]
    },
    {
      id: "design-system",
      lane: "NEXT",
      category: "UI",
      app: "UI",
      label: "Extract reusable dashboard components into shared UI primitives"
    },
    {
      id: "deployment-baseline",
      lane: "NEXT",
      category: "Infrastructure",
      app: "PLATFORM",
      label: "Prepare the dashboard deployment baseline"
    }
  ],
  later: [
    {
      id: "finance-app",
      lane: "LATER",
      app: "PLATFORM",
      label: "Add Finance as an internal platform application"
    },
    {
      id: "security-app",
      lane: "LATER",
      app: "PLATFORM",
      label: "Add Security as an internal platform application"
    },
    {
      id: "ui-preview",
      lane: "LATER",
      app: "UI",
      label: "Add UI Preview for shared component validation"
    }
  ]
};

const currentUser: UserProfile = {
  id: "benji",
  name: "Benji Rodriguez",
  username: "benji",
  email: "benjamin.rodriguez@zivelo.dev",
  role: "Platform Owner",
  avatarUrl:
    "https://i.pinimg.com/736x/2c/ed/94/2ced942397c59e2e4dd88aee36ce9b0b.jpg"
};

const metrics: PlatformMetric[] = [
  { label: "Current version", value: "0.1", tone: "good" },
  { label: "Target version", value: "1.0", tone: "neutral" },
  { label: "Auth", value: "Planned", tone: "warning" },
  { label: "Data", value: "Mock driver", tone: "warning" }
];

export function createDataClient(driver: DataDriver = "mock"): ZipformDataClient {
  if (driver !== "mock") {
    throw new Error(`Unsupported data driver: ${driver}`);
  }

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
    }
  };
}

export const dataClient = createDataClient("mock");
