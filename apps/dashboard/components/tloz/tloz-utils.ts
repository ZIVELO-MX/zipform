import {
  CircleDot,
  Copy,
  Database,
  FileCheck,
  FileText,
  Globe2,
  History,
  KeyRound,
  LayoutDashboard,
  LucideIcon,
  Search,
  Shield,
  Sparkles,
  Star,
  Sword,
  Utensils,
  Wrench
} from "lucide-react";
import type { TlozMissionRecord } from "../../lib/tloz-data";
import type { TlozMissionStatus, TlozMissionType } from "@zipform/types";

export const missionTypeLabel: Record<TlozMissionType, string> = {
  main_quest: "Main Quest",
  side_quest: "Side Quest",
  farming_quest: "Farming Quest",
  exploration_quest: "Explore"
};

export const missionStatusLabel: Record<TlozMissionStatus, string> = {
  now: "Now",
  next: "Next",
  later: "Later",
  completed: "Completada",
  blocked: "Bloqueada"
};

export const missionStatusTone: Record<TlozMissionStatus, string> = {
  now: "#1E8E5A",
  next: "#2D6CDF",
  later: "#7A4ED9",
  blocked: "#B91C22",
  completed: "#6B6B6B"
};

export const missionTypeTone: Record<TlozMissionType, string> = {
  main_quest: "#d72228",
  side_quest: "#2d6cdf",
  farming_quest: "#1e8e5a",
  exploration_quest: "#7a4ed9"
};

const iconRegistry: Record<string, LucideIcon> = {
  Copy,
  Database,
  FileCheck,
  FileText,
  Globe2,
  History,
  KeyRound,
  LayoutDashboard,
  Search,
  Shield,
  Sparkles,
  Star,
  Sword,
  Utensils,
  Wrench
};

export function resolveMissionIcon(icon: string): LucideIcon {
  return iconRegistry[icon] ?? CircleDot;
}

export function resolveIconLabel(icon: string): string {
  if (!icon) return "Unknown";
  return icon
    .replace(/([A-Z])/g, " $1")
    .trim();
}

export function formatDate(date?: string) {
  if (!date) return "Sin fecha";

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${date}T12:00:00`));
}

export function missionPreviewDescription(description: string) {
  return description.trim();
}

export function dependencyLabel(mission: TlozMissionRecord) {
  if (mission.dependencies.length === 0) return "Sin dependencias";
  if (mission.dependencies.length === 1) return "1 dependencia";
  return `${mission.dependencies.length} dependencias`;
}

export function pendingDependencyCount(mission: Pick<TlozMissionRecord, "dependencies" | "requiredQuestItems">) {
  return mission.dependencies.filter((dependency) => dependency.status !== "completed").length
    + mission.requiredQuestItems.filter((item) => item.status !== "unlocked").length;
}

/** Stable topological ordering where dependencies are rendered before dependents. */
export function topologicalMissionOrder<T extends Pick<TlozMissionRecord, "id" | "dependencies">>(missions: T[]) {
  const byId = new Map(missions.map((mission) => [mission.id, mission]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const result: T[] = [];
  function visit(mission: T) {
    if (visited.has(mission.id)) return;
    if (visiting.has(mission.id)) return;
    visiting.add(mission.id);
    mission.dependencies.forEach((dependency) => {
      const local = byId.get(dependency.id);
      if (local) visit(local);
    });
    visiting.delete(mission.id);
    visited.add(mission.id);
    result.push(mission);
  }
  missions.forEach(visit);
  return result;
}
