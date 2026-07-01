import {
  CircleDot,
  Copy,
  Database,
  FileCheck,
  FileText,
  History,
  KeyRound,
  LayoutDashboard,
  LucideIcon,
  Search,
  Shield,
  Sparkles,
  Sword,
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
  History,
  KeyRound,
  LayoutDashboard,
  Search,
  Shield,
  Sparkles,
  Sword,
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

export function missionPreviewDescription(markdown: string) {
  return markdown
    .split(/\r?\n/)
    .filter((line) => !/^\s*[-*+]\s+/.test(line))
    .map((line) => line.replace(/^\s{0,3}#{1,6}\s+/, "").trim())
    .filter(Boolean)
    .join(" ");
}

export function dependencyLabel(mission: TlozMissionRecord) {
  if (mission.dependencies.length === 0) return "Sin dependencias";
  if (mission.dependencies.length === 1) return "1 dependencia";
  return `${mission.dependencies.length} dependencias`;
}
