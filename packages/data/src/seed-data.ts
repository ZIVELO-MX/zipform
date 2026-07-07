import type {
  AppModule,
  PlatformMetric,
  RoadmapSnapshot,
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

export const now = "2026-06-24T16:00:00.000Z";

export const apps: AppModule[] = [
  {
    id: "quotes",
    name: "Quotes",
    shortName: "Quotes",
    description:
      "Quote workflow entry point. The product exists, but this section is a platform placeholder until integration work starts.",
    href: "/quotes",
    status: "external",
    versionTarget: "1.1",
    owner: "quotes"
  },
  {
    id: "tloz",
    name: "TLOZ",
    shortName: "TLOZ",
    description:
      "The Legend of Zivelo module for Missions, Inventory, board, list, table, calendar, and Mission detail workflows.",
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

export const roadmap: RoadmapSnapshot = {
  currentVersion: "1.0",
  targetVersion: "1.1",
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
      label: "Replace TLOZ mock repositories with persistence, permissions, and global search",
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

export const currentUser: UserProfile = {
  id: "owner",
  name: "Owner",
  username: "owner",
  email: "owner@zipform.dev",
  role: "Platform Owner",
  type: "human",
  avatarUrl: "🦊",
  theme: "system"
};

export const raulUser: UserProfile = {
  id: "developer",
  name: "Developer",
  username: "developer",
  email: "developer@zipform.dev",
  role: "Developer",
  type: "human",
  avatarUrl: "⚔️",
  theme: "system"
};

export const users: UserProfile[] = [currentUser, raulUser];

export type AgentApiKeySeed = {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  rawKey: string;
  createdAt: string;
  updatedAt: string;
};

export const agentApiKeys: AgentApiKeySeed[] = [];

export const metrics: PlatformMetric[] = [
  { label: "Current version", value: "1.0", tone: "good" },
  { label: "Target version", value: "1.1", tone: "neutral" },
  { label: "Auth", value: "Enabled", tone: "good" },
  { label: "Data", value: "Prisma PostgreSQL", tone: "good" }
];

export const seasons: TlozSeason[] = [
  {
    id: "season-1",
    name: "Season 1",
    version: "v1.0.0",
    description: "Fundación operativa para convertir TLOZ en un sistema de trabajo usable.",
    status: "active",
    startDate: "2026-06-01",
    endDate: "2026-09-30",
    createdAt: now,
    updatedAt: now
  }
];

export const episodes: TlozEpisode[] = [
  {
    id: "episode-auth",
    seasonId: "season-1",
    name: "Episode I - Foundation",
    romanNumber: "I",
    description: "Primer bloque de estructura, navegación y datos de Missions.",
    status: "active",
    startDate: "2026-06-01",
    endDate: "2026-07-15",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "episode-ops",
    seasonId: "season-1",
    name: "Episode II - Operations",
    romanNumber: "II",
    description: "Flujos de trabajo, recursos y colaboración del equipo.",
    status: "planned",
    startDate: "2026-07-16",
    endDate: "2026-08-31",
    createdAt: now,
    updatedAt: now
  }
];

export const projects: TlozProject[] = [
  {
    id: "project-core",
    slug: "core",
    name: "Core",
    description: "Base compartida de navegación, datos y vistas.",
    descriptionDetail: "",
    color: "#d72228",
    icon: "Sword",
    status: "active",
    type: "normal",
    ownerId: "owner",
    startDate: "2026-06-01",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "project-growth",
    slug: "growth",
    name: "Growth",
    description: "Mejoras de visibilidad, adopción y comunicación del roadmap.",
    descriptionDetail: "",
    color: "#2f7d4f",
    icon: "Sparkles",
    status: "active",
    type: "normal",
    ownerId: "owner",
    startDate: "2026-06-08",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "project-ops",
    slug: "operations",
    name: "Operations",
    description: "Rutinas de mantenimiento, recursos y salud del producto.",
    descriptionDetail: "",
    color: "#8a6f2a",
    icon: "Shield",
    status: "planned",
    type: "normal",
    ownerId: "owner",
    startDate: "2026-07-01",
    createdAt: now,
    updatedAt: now
  }
];

export const questItems: TlozQuestItem[] = [
  {
    id: "quest-item-db",
    name: "Selected Provider",
    description: "Proveedor de persistencia elegido para reemplazar el driver mock.",
    descriptionDetail: "",
    icon: "Database",
    status: "locked",
    category: "tool",
    ownerId: "owner",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "quest-item-auth",
    name: "Auth Baseline",
    description: "Identidad compartida lista para ownership real.",
    descriptionDetail: "",
    icon: "KeyRound",
    status: "locked",
    category: "access",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "quest-item-copy",
    name: "Approved Copy",
    description: "Lenguaje de producto revisado para el equipo.",
    descriptionDetail: "",
    icon: "FileCheck",
    status: "unlocked",
    category: "document",
    ownerId: "owner",
    acquiredAt: "2026-06-18",
    createdAt: now,
    updatedAt: now
  }
];

export const missions: TlozMission[] = [
  {
    id: "mission-dashboard",
    displayId: "COR-0001",
    title: "Publicar dashboard operativo de TLOZ",
    description: "Reemplazar el placeholder con vistas reales de Missions, Projects e Inventory usando datos mock.",
    icon: "LayoutDashboard",
    type: "main_quest",
    status: "now",
    ownerId: "owner",
    projectId: "project-core",
    seasonId: "season-1",
    episodeId: "episode-auth",
    dueDate: "2026-06-28",
    startDate: "2026-06-21",
    progress: 72,
    createdAt: "2026-06-18T15:00:00.000Z",
    updatedAt: now
  },
  {
    id: "mission-search",
    displayId: "GRO-0001",
    title: "Definir navegación por búsqueda global",
    description: "Alinear cómo búsqueda abre Missions, Projects, Inventory y Recursos desde una sola entrada.",
    icon: "Search",
    type: "exploration_quest",
    status: "now",
    conclusion: "Pendiente: el mock actual solo filtra localmente; falta command/search global.",
    ownerId: "owner",
    projectId: "project-growth",
    seasonId: "season-1",
    episodeId: "episode-auth",
    dueDate: "2026-07-02",
    startDate: "2026-06-24",
    progress: 38,
    createdAt: "2026-06-20T15:00:00.000Z",
    updatedAt: now
  },
  {
    id: "mission-db-driver",
    displayId: "COR-0002",
    title: "Diseñar driver persistente de Missions",
    description: "Preparar contratos para reemplazar el mock sin cambiar las páginas de TLOZ.",
    icon: "Database",
    type: "main_quest",
    status: "next",
    ownerId: "owner",
    projectId: "project-core",
    seasonId: "season-1",
    episodeId: "episode-ops",
    dueDate: "2026-07-10",
    progress: 16,
    createdAt: "2026-06-21T15:00:00.000Z",
    updatedAt: now
  },
  {
    id: "mission-resources",
    displayId: "OPE-0001",
    title: "Modelar recursos adjuntos",
    description: "Definir comportamiento de links, documentos, imágenes, archivos y notas dentro de Mission Detail.",
    icon: "FileText",
    type: "side_quest",
    status: "next",
    ownerId: "owner",
    projectId: "project-ops",
    seasonId: "season-1",
    episodeId: "episode-ops",
    dueDate: "2026-07-18",
    progress: 24,
    createdAt: "2026-06-22T15:00:00.000Z",
    updatedAt: now
  },
  {
    id: "mission-maintenance",
    displayId: "OPE-0002",
    title: "Auditar checklist y estados bloqueados",
    description: "Validar que dependencias e Inventory se entiendan con reglas persistentes.",
    icon: "Wrench",
    type: "farming_quest",
    status: "later",
    ownerId: "owner",
    projectId: "project-ops",
    seasonId: "season-1",
    progress: 8,
    createdAt: "2026-06-22T15:00:00.000Z",
    updatedAt: now
  },
  {
    id: "mission-activity",
    displayId: "GRO-0002",
    title: "Especificar actividad de Missions",
    description: "Resolver qué eventos se muestran en el historial básico y cuáles pertenecen a auditoría.",
    icon: "History",
    type: "exploration_quest",
    status: "later",
    ownerId: "owner",
    projectId: "project-growth",
    seasonId: "season-1",
    dueDate: "2026-08-04",
    progress: 0,
    createdAt: "2026-06-23T15:00:00.000Z",
    updatedAt: now
  },
  {
    id: "mission-wallet",
    displayId: "COR-0003",
    title: "Integrar Wallet API",
    description: "Conectar con el proveedor de wallets para soporte multi-moneda en pagos.",
    icon: "Copy",
    type: "main_quest",
    status: "now",
    ownerId: "owner",
    projectId: "project-core",
    seasonId: "season-1",
    episodeId: "episode-auth",
    dueDate: "2026-07-05",
    startDate: "2026-06-22",
    progress: 45,
    createdAt: "2026-06-21T15:00:00.000Z",
    updatedAt: now
  },
  {
    id: "mission-notifications",
    displayId: "GRO-0003",
    title: "Diseñar sistema de notificaciones",
    description: "Definir eventos, canales y preferencias de notificación para el equipo.",
    icon: "History",
    type: "exploration_quest",
    status: "next",
    ownerId: "owner",
    projectId: "project-growth",
    seasonId: "season-1",
    episodeId: "episode-ops",
    dueDate: "2026-07-20",
    progress: 12,
    createdAt: "2026-06-22T15:00:00.000Z",
    updatedAt: now
  },
  {
    id: "mission-login",
    displayId: "COR-0004",
    title: "Implementar login con Google",
    description: "Agregar OAuth de Google como método de autenticación alternativo.",
    icon: "Database",
    type: "side_quest",
    status: "later",
    ownerId: "owner",
    projectId: "project-core",
    seasonId: "season-1",
    episodeId: "episode-ops",
    dueDate: "2026-08-01",
    progress: 0,
    createdAt: "2026-06-23T15:00:00.000Z",
    updatedAt: now
  },
  {
    id: "mission-copy",
    displayId: "GRO-0004",
    title: "Cerrar lenguaje de primera versión",
    description: "Normalizar español de UI y conservar términos RPG en English.",
    icon: "Copy",
    type: "side_quest",
    status: "completed",
    conclusion: "La guía base queda en español con Main Quest, Side Quest, Farming Quest, Exploration Quest e Inventory en English.",
    ownerId: "owner",
    projectId: "project-growth",
    seasonId: "season-1",
    episodeId: "episode-auth",
    dueDate: "2026-06-20",
    completedAt: "2026-06-20T20:30:00.000Z",
    progress: 100,
    createdAt: "2026-06-16T15:00:00.000Z",
    updatedAt: "2026-06-20T20:30:00.000Z"
  }
];

export const missionDependencies: TlozMissionDependency[] = [
  {
    id: "dependency-db-provider",
    missionId: "mission-db-driver",
    dependsOnMissionId: "mission-dashboard",
    createdAt: now
  },
  {
    id: "dependency-resources-driver",
    missionId: "mission-resources",
    dependsOnMissionId: "mission-maintenance",
    createdAt: now
  }
];

export const missionQuestItems: TlozMissionQuestItem[] = [
  { id: "mqi-dashboard-copy", missionId: "mission-dashboard", questItemId: "quest-item-copy", required: true, createdAt: now },
  { id: "mqi-search-auth", missionId: "mission-search", questItemId: "quest-item-auth", required: false, createdAt: now },
  { id: "mqi-db-provider", missionId: "mission-db-driver", questItemId: "quest-item-db", required: true, createdAt: now },
  { id: "mqi-resources-db", missionId: "mission-resources", questItemId: "quest-item-db", required: true, createdAt: now }
];

export const checklistItems: TlozChecklistItem[] = [
  { id: "check-dashboard-routes", missionId: "mission-dashboard", title: "Crear vistas Dashboard, Board, Lista, Tabla y Calendario", completed: true, position: 1, createdAt: now, updatedAt: now },
  { id: "check-dashboard-detail", missionId: "mission-dashboard", title: "Exponer Mission Detail con metadatos y recursos", completed: true, position: 2, createdAt: now, updatedAt: now },
  { id: "check-dashboard-persist", missionId: "mission-dashboard", title: "Definir persistencia de creación y edición", completed: false, position: 3, createdAt: now, updatedAt: now },
  { id: "check-search-scope", missionId: "mission-search", title: "Documentar alcance de búsqueda global", completed: false, position: 1, createdAt: now, updatedAt: now }
];

export const resources: TlozResource[] = [
  {
    id: "resource-ui",
    missionId: "mission-dashboard",
    type: "document",
    title: "TLOZ UI reference",
    url: "/imports/tloz/TLOZ_UI_v2.md",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "resource-schema",
    missionId: "mission-dashboard",
    type: "document",
    title: "TLOZ schema",
    url: "/imports/tloz/SCHEMA.md",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "resource-search-note",
    missionId: "mission-search",
    type: "note",
    title: "Placeholder local hasta integrar command/search",
    createdAt: now,
    updatedAt: now
  }
];

export const userMissionStates: TlozUserMissionState[] = [
  {
    id: "state-active",
    userId: "owner",
    missionId: "mission-dashboard",
    slot: "active_quest",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "state-support",
    userId: "owner",
    missionId: "mission-search",
    slot: "support_quest",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "state-raul-active",
    userId: "owner",
    missionId: "mission-wallet",
    slot: "active_quest",
    createdAt: now,
    updatedAt: now
  }
];

export const recentActivity = [
  { user: "Developer", action: "completó el item de Inventory", target: "Selected Provider", time: "hace 12 min", dotColor: "#1E8E5A" },
  { user: "Owner", action: "movió", target: "Publicar dashboard operativo de TLOZ", time: "hace 1 h", dotColor: "#D72228" },
  { user: "Developer", action: "creó la Mission", target: "Integrar Wallet API", time: "hace 3 h", dotColor: "#7A4ED9" },
  { user: "Sistema", action: "Owner de", target: "Diseñar driver persistente de Missions", time: "ayer", dotColor: "#2D6CDF" }
];
