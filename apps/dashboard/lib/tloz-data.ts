import type {
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
import { currentUser, raulUser } from "@zipform/data";

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

const now = "2026-06-24T16:00:00.000Z";

const seasons: TlozSeason[] = [
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

const episodes: TlozEpisode[] = [
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

const projects: TlozProject[] = [
  {
    id: "project-core",
    name: "Core",
    description: "Base compartida de navegación, datos y vistas.",
    color: "#d72228",
    icon: "Sword",
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "project-growth",
    name: "Growth",
    description: "Mejoras de visibilidad, adopción y comunicación del roadmap.",
    color: "#2f7d4f",
    icon: "Sparkles",
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "project-ops",
    name: "Operations",
    description: "Rutinas de mantenimiento, recursos y salud del producto.",
    color: "#8a6f2a",
    icon: "Shield",
    status: "planned",
    createdAt: now,
    updatedAt: now
  }
];

const questItems: TlozQuestItem[] = [
  {
    id: "quest-item-db",
    name: "Selected Provider",
    description: "Proveedor de persistencia elegido para reemplazar el driver mock.",
    icon: "Database",
    status: "planned",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "quest-item-auth",
    name: "Auth Baseline",
    description: "Identidad compartida lista para ownership real.",
    icon: "KeyRound",
    status: "active",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "quest-item-copy",
    name: "Approved Copy",
    description: "Lenguaje de producto revisado para el equipo.",
    icon: "FileCheck",
    status: "completed",
    acquiredAt: "2026-06-18",
    createdAt: now,
    updatedAt: now
  }
];

const missions: TlozMission[] = [
  {
    id: "mission-dashboard",
    title: "Publicar dashboard operativo de TLOZ",
    description: "Reemplazar el placeholder con vistas reales de Missions, Proyectos y Quest Items usando datos mock.",
    icon: "LayoutDashboard",
    type: "main_quest",
    status: "now",
    ownerId: "benji",
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
    title: "Definir navegación por búsqueda global",
    description: "Alinear cómo búsqueda abre Missions, Proyectos, Quest Items y Recursos desde una sola entrada.",
    icon: "Search",
    type: "exploration_quest",
    status: "now",
    conclusion: "Pendiente: el mock actual solo filtra localmente; falta command/search global.",
    ownerId: "benji",
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
    title: "Diseñar driver persistente de Missions",
    description: "Preparar contratos para reemplazar el mock sin cambiar las páginas de TLOZ.",
    icon: "Database",
    type: "main_quest",
    status: "next",
    ownerId: "benji",
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
    title: "Modelar recursos adjuntos",
    description: "Definir comportamiento de links, documentos, imágenes, archivos y notas dentro de Mission Detail.",
    icon: "FileText",
    type: "side_quest",
    status: "next",
    ownerId: "benji",
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
    title: "Auditar checklist y estados bloqueados",
    description: "Validar que dependencias y Quest Items se entiendan sin reglas persistentes todavía.",
    icon: "Wrench",
    type: "farming_quest",
    status: "later",
    ownerId: "benji",
    projectId: "project-ops",
    seasonId: "season-1",
    progress: 8,
    createdAt: "2026-06-22T15:00:00.000Z",
    updatedAt: now
  },
  {
    id: "mission-activity",
    title: "Especificar actividad de Missions",
    description: "Resolver qué eventos se muestran en el historial básico y cuáles pertenecen a auditoría.",
    icon: "History",
    type: "exploration_quest",
    status: "later",
    ownerId: "benji",
    projectId: "project-growth",
    seasonId: "season-1",
    dueDate: "2026-08-04",
    progress: 0,
    createdAt: "2026-06-23T15:00:00.000Z",
    updatedAt: now
  },
  {
    id: "mission-wallet",
    title: "Integrar Wallet API",
    description: "Conectar con el proveedor de wallets para soporte multi-moneda en pagos.",
    icon: "Copy",
    type: "main_quest",
    status: "now",
    ownerId: "raul",
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
    title: "Diseñar sistema de notificaciones",
    description: "Definir eventos, canales y preferencias de notificación para el equipo.",
    icon: "History",
    type: "exploration_quest",
    status: "next",
    ownerId: "raul",
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
    title: "Implementar login con Google",
    description: "Agregar OAuth de Google como método de autenticación alternativo.",
    icon: "Database",
    type: "side_quest",
    status: "later",
    ownerId: "raul",
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
    title: "Cerrar lenguaje de primera versión",
    description: "Normalizar español de UI y conservar términos RPG en English.",
    icon: "Copy",
    type: "side_quest",
    status: "completed",
    conclusion: "La guía base queda en español con Main Quest, Side Quest, Farming Quest, Exploration Quest y Quest Item en English.",
    ownerId: "benji",
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

const missionDependencies: TlozMissionDependency[] = [
  {
    id: "dependency-db-provider",
    missionId: "mission-db-driver",
    dependsOnMissionId: "mission-dashboard",
    createdAt: now
  },
  {
    id: "dependency-resources-driver",
    missionId: "mission-resources",
    dependsOnMissionId: "mission-db-driver",
    createdAt: now
  }
];

const missionQuestItems: TlozMissionQuestItem[] = [
  { id: "mqi-dashboard-copy", missionId: "mission-dashboard", questItemId: "quest-item-copy", required: true, createdAt: now },
  { id: "mqi-search-auth", missionId: "mission-search", questItemId: "quest-item-auth", required: false, createdAt: now },
  { id: "mqi-db-provider", missionId: "mission-db-driver", questItemId: "quest-item-db", required: true, createdAt: now },
  { id: "mqi-resources-db", missionId: "mission-resources", questItemId: "quest-item-db", required: true, createdAt: now }
];

const checklistItems: TlozChecklistItem[] = [
  { id: "check-dashboard-routes", missionId: "mission-dashboard", title: "Crear vistas Dashboard, Board, Lista, Tabla y Calendario", completed: true, position: 1, createdAt: now, updatedAt: now },
  { id: "check-dashboard-detail", missionId: "mission-dashboard", title: "Exponer Mission Detail con metadatos y recursos", completed: true, position: 2, createdAt: now, updatedAt: now },
  { id: "check-dashboard-persist", missionId: "mission-dashboard", title: "Definir persistencia de creación y edición", completed: false, position: 3, createdAt: now, updatedAt: now },
  { id: "check-search-scope", missionId: "mission-search", title: "Documentar alcance de búsqueda global", completed: false, position: 1, createdAt: now, updatedAt: now }
];

const resources: TlozResource[] = [
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

const userMissionStates: TlozUserMissionState[] = [
  {
    id: "state-active",
    userId: "benji",
    missionId: "mission-dashboard",
    slot: "active_quest",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "state-support",
    userId: "benji",
    missionId: "mission-search",
    slot: "support_quest",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "state-raul-active",
    userId: "raul",
    missionId: "mission-wallet",
    slot: "active_quest",
    createdAt: now,
    updatedAt: now
  }
];

const ownerMap: Record<string, UserProfile> = { [currentUser.id]: currentUser, [raulUser.id]: raulUser };

function byId<T extends { id: string }>(items: T[], id?: string) {
  return id ? items.find((item) => item.id === id) : undefined;
}

function hydrateMission(mission: TlozMission): TlozMissionRecord {
  const project = byId(projects, mission.projectId);

  if (!project) {
    throw new Error(`TLOZ mock mission ${mission.id} is missing project ${mission.projectId}`);
  }

  const dependencyIds = missionDependencies
    .filter((dependency) => dependency.missionId === mission.id)
    .map((dependency) => dependency.dependsOnMissionId);
  const relatedQuestItems = missionQuestItems.filter((item) => item.missionId === mission.id);
  const missionQuestItemIds = relatedQuestItems.map((item) => item.questItemId);
  const hydratedQuestItems = questItems.filter((item) => missionQuestItemIds.includes(item.id));
  const requiredQuestItemIds = relatedQuestItems.filter((item) => item.required).map((item) => item.questItemId);

  return {
    ...mission,
    project,
    season: byId(seasons, mission.seasonId),
    episode: byId(episodes, mission.episodeId),
    dependencies: missions.filter((item) => dependencyIds.includes(item.id)),
    questItems: hydratedQuestItems,
    requiredQuestItems: hydratedQuestItems.filter((item) => requiredQuestItemIds.includes(item.id)),
    owner: ownerMap[mission.ownerId] ?? {
      id: mission.ownerId,
      name: mission.ownerId,
      username: mission.ownerId,
      email: "",
      role: "",
      avatarUrl: ""
    }
  };
}

function hydrateMissions() {
  return missions.map(hydrateMission);
}

export async function getTlozDashboardSummary(): Promise<TlozDashboardSummary> {
  const hydrated = hydrateMissions();
  const activeQuestId = userMissionStates.find((state) => state.slot === "active_quest" && state.userId === "benji")?.missionId;
  const activeSupportQuestId = userMissionStates.find((state) => state.slot === "support_quest" && state.userId === "benji")?.missionId;

  return {
    activeQuest: hydrated.find((mission) => mission.id === activeQuestId) ?? null,
    activeSupportQuest: hydrated.find((mission) => mission.id === activeSupportQuestId) ?? null,
    nowMissions: hydrated.filter((mission) => mission.status === "now"),
    mainQuests: hydrated.filter((mission) => mission.type === "main_quest" && mission.status !== "completed"),
    upcomingMissions: hydrated.filter((mission) => mission.status === "next"),
    futureMissions: hydrated.filter((mission) => mission.status === "later"),
    projects: projects.map((project) => {
      const projectMissions = hydrated.filter((mission) => mission.projectId === project.id);
      return {
        ...project,
        totalMissions: projectMissions.length,
        nowMissions: projectMissions.filter((mission) => mission.status === "now").length,
        completedMissions: projectMissions.filter((mission) => mission.status === "completed").length
      };
    }),
    recentActivity: [
      { user: "Raúl", action: "completó el Quest Item", target: "Selected Provider", time: "hace 12 min", dotColor: "#1E8E5A" },
      { user: "Benji", action: "movió", target: "Publicar dashboard operativo de TLOZ", time: "hace 1 h", dotColor: "#D72228" },
      { user: "Raúl", action: "creó la Mission", target: "Integrar Wallet API", time: "hace 3 h", dotColor: "#7A4ED9" },
      { user: "Sistema", action: "Owner de", target: "Diseñar driver persistente de Missions", time: "ayer", dotColor: "#2D6CDF" }
    ],
    questItems
  };
}

export async function getTlozMissions(): Promise<TlozMissionRecord[]> {
  return hydrateMissions();
}

export async function getTlozMissionDetail(missionId: string): Promise<TlozMissionDetail | null> {
  const mission = hydrateMissions().find((item) => item.id === missionId);

  if (!mission) {
    return null;
  }

  return {
    ...mission,
    checklist: checklistItems
      .filter((item) => item.missionId === mission.id)
      .sort((a, b) => a.position - b.position),
    resources: resources.filter((resource) => resource.missionId === mission.id)
  };
}

export async function getTlozProjects(): Promise<TlozProject[]> {
  return projects;
}

export async function getTlozSeasons(): Promise<TlozSeason[]> {
  return seasons;
}

export async function getTlozEpisodes(): Promise<TlozEpisode[]> {
  return episodes;
}

export async function getTlozQuestItems(): Promise<TlozQuestItem[]> {
  return questItems;
}
