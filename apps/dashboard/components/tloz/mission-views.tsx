"use client";

import Link from "next/link";
import { CSSProperties, useState } from "react";
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverlay,
  KeyboardCoordinateGetter,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { FolderKanban, Link2, Plus } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  displayUsername,
  EmptyState,
  MetricProgress,
  SectionHeading,
  StatusPill,
  ToneBadge,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  UserAvatarLabel,
} from "@zipform/ui";
import type { TlozMissionRecord } from "../../lib/tloz-data";
import type { TlozMissionStatus, UserProfile } from "@zipform/types";
import { QuestItemDots } from "./mission-card";
import { projectHref } from "../../lib/tloz-routes";
import { useTlozViewState, type TlozGrouping } from "./tloz-view-state";
import { EntityList, EntityTable, type EntityColumn } from "./entity-views";
import {
  formatDate,
  missionPreviewDescription,
  missionStatusLabel,
  missionTypeLabel,
  missionTypeTone,
  resolveMissionIcon,
} from "./tloz-utils";

const typeBadgeBg: Record<string, string> = { main_quest: "#FDECEC", side_quest: "#EEF2FF", farming_quest: "#E6F4EA", exploration_quest: "#F2EAFE" };
const typeBadgeText: Record<string, string> = { main_quest: "#B91C22", side_quest: "#2D6CDF", farming_quest: "#1E6B3C", exploration_quest: "#7A4ED9" };

const statusConfig: Record<string, { label: string; dotColor: string; textColor: string; bgColor?: string }> = {
  now: { label: "Now", dotColor: "#1E8E5A", textColor: "#1E8E5A" },
  next: { label: "Next", dotColor: "#3A47B5", textColor: "#3A47B5" },
  later: { label: "Later", dotColor: "#9a9a98", textColor: "#6B6B6B" },
  completed: { label: "Completed", dotColor: "#1E6B3C", textColor: "#1E6B3C" },
  blocked: { label: "Blocked", dotColor: "#B91C22", textColor: "#B91C22" },
};

const boardGroups = [
  { id: "now", label: "Now" },
  { id: "next", label: "Next" },
  { id: "later", label: "Later" },
  { id: "blocked", label: "Blocked" },
  { id: "completed", label: "Completed" },
] as const;

// ─── DASHBOARD ────────────────────────────────────────────────────

export function DashboardNowSection({ missions, onSelect }: { missions: TlozMissionRecord[]; onSelect?: (m: TlozMissionRecord) => void }) {
  const questMissions = missions.filter((m) => m.type === "main_quest" || m.type === "side_quest");
  const supportMissions = missions.filter((m) => m.type === "farming_quest" || m.type === "exploration_quest");
  const focusedMissions = [questMissions[0], supportMissions[0]].filter(Boolean);

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "13px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "#1E8E5A", animation: "nowpulse 1.8s ease-in-out infinite" }} />
          <h2 style={{ margin: 0, fontSize: "12.5px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#454543" }}>
            En curso ahora · Mi foco
          </h2>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            fontSize: "11.5px",
            color: "#6B6B6B",
            background: "#fff",
            border: "1px solid rgba(29,29,27,0.10)",
            borderRadius: "999px",
            padding: "5px 11px",
            fontWeight: 500
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D72228" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" />
          </svg>
          Límite de foco: <b style={{ color: "#1D1D1B", fontWeight: 700 }}>1 Quest + 1 Support</b> por persona
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.08fr 1fr", gap: "16px" }}>
        {focusedMissions.length > 0 ? (
          focusedMissions.map((mission) => (
            <DashboardNowCard key={mission.id} mission={mission} onSelect={onSelect} />
          ))
        ) : (
          <div className="panel" style={{ padding: "20px", gridColumn: "1 / -1", textAlign: "center", color: "#6B6B6B" }}>
            Sin missions activas ahora mismo.
          </div>
        )}
      </div>
    </section>
  );
}

function DashboardNowCard({ mission, onSelect }: { mission: TlozMissionRecord; onSelect?: (m: TlozMissionRecord) => void }) {
  const tone = missionTypeTone[mission.type];

  return (
    <div
      className="tloz-card-hover"
      style={{
        background: "#fff",
        border: "1px solid rgba(29,29,27,0.10)",
        borderRadius: "18px",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
        transition: "all .22s ease",
        boxShadow: "0 12px 30px rgba(29,29,27,0.05)",
        cursor: "pointer"
      }}
      onClick={() => onSelect?.(mission)}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: tone }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: tone === "#d72228" ? "#FDECEC" : tone === "#7a4ed9" ? "#F2EAFE" : "#F5F5F5",
            color: tone,
            fontSize: "11px",
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: "999px",
            letterSpacing: "0.01em"
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill={tone === "#d72228" ? "currentColor" : "none"} stroke={tone !== "#d72228" ? "currentColor" : undefined} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {tone === "#d72228" ? (
              <path d="M12 2.4l2.64 5.35 5.9.86-4.27 4.16 1.01 5.88L12 15.73l-5.28 2.78 1.01-5.88L3.46 8.6l5.9-.86z" />
            ) : (
              <>
                <circle cx="12" cy="12" r="9" />
                <polygon points="15.6 8.4 13.4 13.4 8.4 15.6 10.6 10.6" fill="currentColor" stroke="none" />
              </>
            )}
          </svg>
          {missionTypeLabel[mission.type]}
        </span>
        <div className="flex items-center gap-2"><span className="font-mono text-[10.5px] font-medium text-carbon/40">{mission.displayId}</span><span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, color: "#1E8E5A" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: "#1E8E5A", animation: "nowpulse 1.8s ease-in-out infinite" }} />Now
        </span></div>
      </div>
      <h3 style={{ margin: "0 0 7px", fontSize: "19px", fontWeight: 700, letterSpacing: "-0.01em" }}>{mission.title}</h3>
      <p style={{ margin: "0 0 16px", fontSize: "13.5px", color: "#6B6B6B", lineHeight: 1.5, textWrap: "pretty" }}>{missionPreviewDescription(mission.description)}</p>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#454543", background: "#F5F5F5", borderRadius: "999px", padding: "4px 10px", fontWeight: 500 }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "2px", background: mission.project?.color || "#999" }} />
          {mission.project?.name ?? "Sin proyecto"}
        </span>
        {mission.episode && (
          <span style={{ fontSize: "12px", color: "#6B6B6B", background: "#F5F5F5", borderRadius: "999px", padding: "4px 10px", fontWeight: 500 }}>
            {mission.episode.name}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(29,29,27,0.07)", paddingTop: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <Avatar className="size-7 rounded-full">
            <AvatarImage src={mission.owner.avatarUrl} alt="" />
            <AvatarFallback className="bg-carbon text-[0.6rem] font-medium text-white">
              {mission.owner.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div style={{ fontSize: "11.5px", fontWeight: 500, color: "#6B6B6B" }}>@{mission.owner.username ? displayUsername(mission.owner.username) : mission.owner.name}</div>
        </div>
        {mission.dueDate ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#B91C22", fontWeight: 600, background: "#FDECEC", borderRadius: "999px", padding: "5px 11px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4.5" width="18" height="17" rx="2" /><line x1="3" y1="9.5" x2="21" y2="9.5" /><line x1="8" y1="2.5" x2="8" y2="6.5" />
            </svg>
            Vence {formatDate(mission.dueDate)}
          </span>
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6B6B6B", fontWeight: 500 }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "2px", background: mission.project?.color || "#999" }} />
            {mission.project?.name ?? "Sin proyecto"}
          </span>
        )}
      </div>
    </div>
  );
}

export function DashboardMainQuests({ missions, onSelect }: { missions: TlozMissionRecord[]; onSelect?: (m: TlozMissionRecord) => void }) {
  const { setState } = useTlozViewState();
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "13px" }}>
        <h2 style={{ margin: 0, fontSize: "12.5px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#454543", display: "flex", alignItems: "center", gap: "9px" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#D72228"><path d="M12 2.4l2.64 5.35 5.9.86-4.27 4.16 1.01 5.88L12 15.73l-5.28 2.78 1.01-5.88L3.46 8.6l5.9-.86z" /></svg>
          Main Quests
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#9a9a98", background: "#F1F0EE", borderRadius: "999px", padding: "1px 8px", fontWeight: 500 }}>{missions.length}</span>
        </h2>
        <button type="button" onClick={() => setState({ view: "list" })} style={{ fontSize: "12.5px", color: "#D72228", fontWeight: 600, background: "transparent", border: 0, padding: 0, cursor: "pointer" }}>
          Ver todas →
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {missions.slice(0, 3).map((mission) => <DashboardMainQuestCard key={mission.id} mission={mission} onSelect={onSelect} />)}
      </div>
    </section>
  );
}

function DashboardMainQuestCard({ mission, onSelect }: { mission: TlozMissionRecord; onSelect?: (m: TlozMissionRecord) => void }) {
  const tone = missionTypeTone[mission.type];
  const blocked = mission.requiredQuestItems.some((item) => item.status !== "unlocked") || mission.dependencies.length > 0;
  const statusCfg = statusConfig[mission.status === "blocked" ? "now" : mission.status];

  return (
    <div
      className="tloz-card-hover"
      style={{
        background: "#fff",
        border: "1px solid rgba(29,29,27,0.10)",
        borderRadius: "16px",
        padding: "17px",
        transition: "all .22s ease",
        cursor: "pointer"
      }}
      onClick={() => onSelect?.(mission)}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <span className="inline-flex items-center gap-1.5 rounded-full px-[9px] py-[3px] text-[10.5px] font-bold" style={{ background: typeBadgeBg[mission.type], color: typeBadgeText[mission.type] }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.4l2.64 5.35 5.9.86-4.27 4.16 1.01 5.88L12 15.73l-5.28 2.78 1.01-5.88L3.46 8.6l5.9-.86z" /></svg>
          {missionTypeLabel[mission.type]}
        </span>
        <div className="flex items-center gap-2"><span className="font-mono text-[10.5px] font-medium text-carbon/40">{mission.displayId}</span><span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "10.5px", fontWeight: 600, color: statusCfg.textColor }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: statusCfg.dotColor, animation: mission.status === "now" ? "nowpulse 1.8s ease-in-out infinite" : undefined }} />{statusCfg.label}
        </span></div>
      </div>
      <h3 style={{ margin: "0 0 10px", fontSize: "15px", fontWeight: 700, lineHeight: 1.25 }}>{mission.title}</h3>
      <div style={{ display: "flex", gap: "7px", marginBottom: "13px" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#6B6B6B", fontWeight: 500 }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "2px", background: mission.project?.color || "#999" }} />
          {mission.project?.name ?? "Sin proyecto"}
        </span>
        {mission.episode && (
          <>
            <span style={{ fontSize: "11px", color: "#bcbcba" }}>·</span>
            <span style={{ fontSize: "11px", color: "#6B6B6B", fontWeight: 500 }}>Ep. {mission.episode.romanNumber}</span>
          </>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <UserAvatarLabel name={mission.owner.name} label={mission.owner.username ? displayUsername(mission.owner.username) : mission.owner.name} labelOnly imageUrl={mission.owner.avatarUrl} size="sm" />
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {blocked && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "10px", color: "#7A5A12", fontWeight: 600, background: "#FFF4DE", borderRadius: "999px", padding: "2px 7px" }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  {mission.dependencies.length + mission.requiredQuestItems.filter(i => i.status !== "unlocked").length}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                {mission.dependencies.length + mission.requiredQuestItems.filter(i => i.status !== "unlocked").length} dependencias
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardNextLaterSection({
  title,
  subtitle,
  missions,
  type,
  onSelect
}: {
  title: string;
  subtitle: string;
  missions: TlozMissionRecord[];
  type: "next" | "later";
  onSelect?: (m: TlozMissionRecord) => void;
}) {
  const statusCfg = statusConfig[type];

  return (
    <div style={{ background: "#fff", border: "1px solid rgba(29,29,27,0.10)", borderRadius: "16px", overflow: "hidden" }}>
      <div style={{ padding: "15px 17px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(29,29,27,0.07)" }}>
        <h2 style={{ margin: 0, fontSize: "12.5px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#454543" }}>
          {title}
        </h2>
        <span style={{ fontSize: "11px", color: "#6B6B6B" }}>{subtitle}</span>
      </div>
      <div style={{ padding: "6px" }}>
        {missions.length > 0 ? (
          missions.map((mission) => {
            const tone = missionTypeTone[mission.type];
            return (
              <div
                key={mission.id}
                className="tloz-row-hover"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "11px",
                  padding: "11px 12px",
                  borderRadius: "11px",
                  cursor: "pointer",
                  transition: "all .15s ease"
                }}
                onClick={() => onSelect?.(mission)}
              >
                <span
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "8px",
                    background: tone === "#d72228" ? "#FDECEC" : tone === "#2d6cdf" ? "#EEF2FF" : tone === "#1e8e5a" ? "#E6F4EA" : "#F2EAFE",
                    color: tone,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: "12px",
                    fontWeight: 700
                  }}
                >
                  {mission.type === "main_quest" ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.4l2.64 5.35 5.9.86-4.27 4.16 1.01 5.88L12 15.73l-5.28 2.78 1.01-5.88L3.46 8.6l5.9-.86z" /></svg>
                  ) : mission.type === "side_quest" ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
                  ) : mission.type === "exploration_quest" ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polygon points="15.6 8.4 13.4 13.4 8.4 15.6 10.6 10.6" fill="currentColor" stroke="none" /></svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></svg>
                  )}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13.5px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}><span className="font-mono text-[10.5px] font-medium text-carbon/40">{mission.displayId}</span>{mission.title}</div>
                  <div style={{ fontSize: "11px", color: "#9a9a98", display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "2px", background: mission.project?.color || "#999" }} />
                    {mission.project?.name ?? "Sin proyecto"} · {missionTypeLabel[mission.type]}
                  </div>
                </div>
                <Avatar className="size-6 rounded-full">
                  <AvatarImage src={mission.owner.avatarUrl} alt="" />
                  <AvatarFallback className="bg-carbon text-[0.55rem] font-medium text-white">
                    {mission.owner.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            );
          })
        ) : (
          <div style={{ padding: "20px", textAlign: "center", color: "#9a9a98", fontSize: "13px" }}>
            Sin missions en esta categoría.
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardProjectsSection({ projects, missions }: { projects: Array<{ id: string; slug: string; name: string; color: string; totalMissions: number; nowMissions: number; completedMissions: number }>; missions: TlozMissionRecord[] }) {
  return (
    <section>
      <SectionHeading icon={<FolderKanban size={15} aria-hidden="true" />} title="Projects" action={<Link href="/tloz/projects" className="text-[12.5px] font-semibold text-zivelo">Ver todos →</Link>} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "13px" }}>
        {projects.map((project) => {
          const projectMissions = missions.filter((m) => m.projectId === project.id);
          const ownerSet = new Set(projectMissions.map(m => m.owner.id));
          const uniqueOwners = Array.from(ownerSet).slice(0, 3);
          return (
            <Link
              href={projectHref(project)}
              key={project.id}
              className="tloz-card-hover"
              style={{
                background: "#fff",
                border: "1px solid rgba(29,29,27,0.10)",
                borderRadius: "14px",
                padding: "15px",
                transition: "all .22s ease"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "12px" }}>
                <span style={{ width: "9px", height: "9px", borderRadius: "3px", background: project.color }} />
                <span style={{ fontWeight: 700, fontSize: "14px" }}>{project.name}</span>
                <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#9a9a98" }}>
                  {project.completedMissions}/{project.totalMissions}
                </span>
              </div>
	              <MetricProgress className="mb-3" value={project.totalMissions > 0 ? Math.round((project.completedMissions / project.totalMissions) * 100) : 0} tone={project.color} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex" }}>
                  {uniqueOwners.map((ownerId) => {
                    const owner = projectMissions.find(m => m.owner.id === ownerId)?.owner;
                    if (!owner) return null;
                    return (
	                      <UserAvatarLabel key={ownerId} className={uniqueOwners.indexOf(ownerId) > 0 ? "-ml-2" : undefined} name={owner.name} imageUrl={owner.avatarUrl} size="sm" />
                    );
                  })}
                </div>
                <span style={{ fontSize: "11px", color: "#6B6B6B", fontWeight: 500 }}>{project.nowMissions} activa{project.nowMissions !== 1 ? "s" : ""}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function DashboardInventorySection({ questItems, onSelect }: { questItems: Array<{ id: string; name: string; description: string; icon: string; status: string }>; onSelect?: (item: TlozMissionRecord["questItems"][number]) => void }) {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "13px" }}>
        <h2 style={{ margin: 0, fontSize: "12.5px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#454543", display: "flex", alignItems: "center", gap: "9px" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7A5A12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Inventory
          <span style={{ fontSize: "11px", color: "#6B6B6B", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>
            desbloqueos reutilizables
          </span>
        </h2>
        <Link href="/tloz/inventory" style={{ fontSize: "12.5px", color: "#D72228", fontWeight: 600, textDecoration: "none", cursor: "pointer" }}>Gestionar →</Link>
      </div>
      <div className="tloz-scrl" style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "4px" }}>
        {questItems.map((item) => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <button type="button"
                className="tloz-qi-hover"
                style={{
                  flex: "0 0 auto",
                  minWidth: "180px",
                  background: "#fff",
                  border: "1px solid rgba(29,29,27,0.10)",
                  borderRadius: "14px",
                  padding: "14px",
                  transition: "all .2s ease",
                  cursor: "pointer"
                }}
                onClick={() => onSelect?.(item as TlozMissionRecord["questItems"][number])}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "9px",
                      background: item.status === "unlocked" ? "#E6F4EA" : "#FFF4DE",
                      color: item.status === "unlocked" ? "#1E6B3C" : "#7A5A12",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {item.icon.slice(0, 1)}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: item.status === "unlocked" ? "#1E6B3C" : "#7A5A12",
                      background: item.status === "unlocked" ? "#E6F4EA" : "#FFF4DE",
                      borderRadius: "999px",
                      padding: "3px 8px"
                    }}
                  >
                    {item.status === "unlocked" ? "Desbloqueado" : "Bloqueado"}
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontSize: "13.5px", marginBottom: "3px" }}>{item.name}</div>
                <div style={{ fontSize: "11px", color: "#9a9a98" }}>{item.description}</div>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              {item.name}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </section>
  );
}

export function DashboardActivitySection({ activities }: { activities: Array<{ user: string; action: string; target: string; time: string; dotColor: string }> }) {
  return (
    <div>
      <div style={{ marginBottom: "13px" }}>
        <h2 style={{ margin: 0, fontSize: "12.5px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#454543" }}>Actividad reciente</h2>
      </div>
      <div style={{ background: "#fff", border: "1px solid rgba(29,29,27,0.10)", borderRadius: "16px", padding: "6px" }}>
        {activities.length > 0 ? activities.map((activity, i) => (
          <div key={i} style={{ display: "flex", gap: "11px", padding: "11px 12px" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: activity.dotColor, display: "block", marginTop: "5px" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "12.5px", lineHeight: 1.45 }}>
                <b style={{ fontWeight: 600 }}>{activity.user}</b> {activity.action} <b style={{ fontWeight: 600, color: "#1E6B3C" }}>{activity.target}</b>
              </div>
              <div style={{ fontSize: "10.5px", color: "#9a9a98", marginTop: "2px", fontFamily: "'JetBrains Mono', monospace" }}>
                {activity.time}
              </div>
            </div>
          </div>
        )) : <EmptyState title="Sin actividad reciente" description="Aún no hay cambios registrados en proyectos o misiones." />}
      </div>
    </div>
  );
}

// ─── TABLE ─────────────────────────────────────────────────────────

export function MissionTable({ missions, onSelect }: { missions: TlozMissionRecord[]; onSelect?: (m: TlozMissionRecord) => void }) {
  const columns: EntityColumn<TlozMissionRecord>[] = [
    { id: "mission", label: "Mission", render: (mission) => <span className="flex items-center gap-2 font-semibold"><span className="font-mono text-[10.5px] font-medium text-carbon/40">{mission.displayId}</span>{mission.title}</span> },
    { id: "status", label: "Estado", render: (mission) => { const cfg = statusConfig[mission.status] ?? statusConfig.now; return <StatusPill label={cfg.label} color={cfg.textColor} active={mission.status === "now"} />; } },
    { id: "type", label: "Tipo", render: (mission) => <ToneBadge tone={{ color: missionTypeTone[mission.type] }} className="text-[11px]">{missionTypeLabel[mission.type]}</ToneBadge> },
    { id: "project", label: "Proyecto", render: (mission) => <span className="inline-flex items-center gap-1.5 text-xs text-carbon/75"><span className="size-[7px] rounded-sm" style={{ background: mission.project?.color || "#999" }} />{mission.project?.name ?? "Sin proyecto"}</span> },
    { id: "owner", label: "Responsable", render: (mission) => <UserAvatarLabel name={mission.owner.name} label={mission.owner.username ? displayUsername(mission.owner.username) : mission.owner.name} labelOnly imageUrl={mission.owner.avatarUrl} size="sm" /> },
    { id: "episode", label: "Ep.", render: (mission) => <span className="text-xs text-carbon/65">{mission.episode?.romanNumber ?? "—"}</span> },
    { id: "due", label: "Vence", align: "right", render: (mission) => <span className="font-mono text-[11.5px]" style={{ color: mission.dueDate ? "#B91C22" : "#9a9a98" }}>{formatDate(mission.dueDate)}</span> },
  ];
  return <EntityTable items={missions} columns={columns} onSelect={onSelect} />;
}

// ─── LIST ──────────────────────────────────────────────────────────

export function MissionList({ missions, grouping = "status", onSelect }: { missions: TlozMissionRecord[]; grouping?: TlozGrouping; onSelect?: (m: TlozMissionRecord) => void }) {
  const groups = grouping === "project"
    ? Array.from(new Map(missions.map((mission) => [mission.projectId ?? "none", mission.project?.name ?? "Sin proyecto"]))).map(([id, label]) => ({ id, label, missions: missions.filter((mission) => (mission.projectId ?? "none") === id) }))
    : grouping === "none"
      ? [{ id: "all", label: "Todas", missions }]
      : [
        { id: "now", label: "Now", missions: missions.filter((mission) => mission.status === "now") },
        { id: "blocked", label: "Blocked", missions: missions.filter((mission) => mission.status === "blocked") },
        { id: "next", label: "Next", missions: missions.filter((mission) => mission.status === "next") },
        { id: "later", label: "Later", missions: missions.filter((mission) => mission.status === "later") },
        { id: "completed", label: "Completed", missions: missions.filter((mission) => mission.status === "completed") },
      ];

  return <div>{groups.filter((group) => group.missions.length).map((group) => {
    const cfg = statusConfig[group.id] ?? { dotColor: "#9a9a98" };
    return <EntityList key={group.id} title={group.label} tone={cfg.dotColor} items={group.missions} onSelect={onSelect} render={(mission) => {
      const tone = missionTypeTone[mission.type];
      const Icon = resolveMissionIcon(mission.icon);
      const blockedCount = mission.dependencies.length + mission.requiredQuestItems.filter((item) => item.status !== "unlocked").length;
      return <span className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)] items-center gap-3.5 md:grid-cols-[minmax(0,1fr)_130px_132px_96px]"><span className="flex min-w-0 items-center gap-2.5"><span className="grid size-6 shrink-0 place-items-center rounded-[7px] [&_svg]:size-3" style={{ color: tone, background: `${tone}18` }}><Icon aria-hidden="true" /></span><span className="font-mono text-[10.5px] text-carbon/40">{mission.displayId}</span><strong className="truncate text-[13.5px]">{mission.title}</strong>{blockedCount ? <span className="rounded-full bg-[#FFF4DE] px-2 py-0.5 text-[9.5px] font-semibold text-[#7A5A12]">{blockedCount}</span> : null}{mission.status === "completed" ? <span className="rounded-full bg-[#E6F4EA] px-2 py-0.5 text-[9.5px] font-semibold text-[#1E6B3C]">✓</span> : null}</span><span className="hidden truncate rounded-full px-[9px] py-[3px] text-[11px] font-bold md:block" style={{ background: `${mission.project?.color || "#999"}18`, color: mission.project?.color || "#999" }}>{mission.project?.name ?? "Sin proyecto"}</span><span className="hidden md:block"><UserAvatarLabel name={mission.owner.name} label={mission.owner.username ? displayUsername(mission.owner.username) : mission.owner.name} labelOnly imageUrl={mission.owner.avatarUrl} size="sm" /></span><span className="hidden text-right font-mono text-[11.5px] md:block" style={{ color: mission.dueDate ? "#B91C22" : "#9a9a98" }}>{formatDate(mission.dueDate)}</span></span>;
    }} />;
  })}</div>;
}

// ─── BOARD ─────────────────────────────────────────────────────────

export function MissionBoard({ missions, onSelect, onStatusChange }: { missions: TlozMissionRecord[]; onSelect?: (m: TlozMissionRecord) => void; onStatusChange?: (id: string, status: TlozMissionStatus) => void }) {
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const keyboardCoordinates: KeyboardCoordinateGetter = (event, { currentCoordinates }) => {
    const step = event.code === "ArrowLeft" || event.code === "ArrowRight" ? 312 : 72;
    if (event.code === "ArrowRight") return { ...currentCoordinates, x: currentCoordinates.x + step };
    if (event.code === "ArrowLeft") return { ...currentCoordinates, x: currentCoordinates.x - step };
    if (event.code === "ArrowDown") return { ...currentCoordinates, y: currentCoordinates.y + step };
    if (event.code === "ArrowUp") return { ...currentCoordinates, y: currentCoordinates.y - step };
    return undefined;
  };
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 240, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: keyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    setActiveMissionId(null);
    const status = String(event.over?.id ?? "").replace("status:", "") as TlozMissionStatus;
    const mission = missions.find((item) => item.id === event.active.id);
    if (!mission || !boardGroups.some((group) => group.id === status) || mission.status === status) return;
    onStatusChange?.(mission.id, status);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(event) => setActiveMissionId(String(event.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveMissionId(null)}
      accessibility={{
        screenReaderInstructions: {
          draggable: "Presiona Espacio o Enter para tomar una misión. Usa las flechas para moverla entre columnas, Espacio o Enter para soltarla y Escape para cancelar.",
        },
        announcements: {
          onDragStart: ({ active }) => `Misión ${active.data.current?.title ?? active.id} seleccionada.`,
          onDragOver: ({ active, over }) => over ? `Misión ${active.data.current?.title ?? active.id} sobre ${String(over.id).replace("status:", "")}.` : undefined,
          onDragEnd: ({ active, over }) => over ? `Misión ${active.data.current?.title ?? active.id} movida a ${String(over.id).replace("status:", "")}.` : `Movimiento cancelado.`,
          onDragCancel: ({ active }) => `Movimiento de ${active.data.current?.title ?? active.id} cancelado.`,
        },
      }}
    >
      <div className="tloz-board-scroll tloz-scrl" aria-label="Board de misiones">
        <div className="tloz-board-track">
          {boardGroups.map((group) => {
            const groupMissions = missions.filter((mission) => mission.status === group.id);
            const tone = group.id === "now" ? "#1E8E5A" : group.id === "next" ? "#3A47B5" : group.id === "later" ? "#9a9a98" : group.id === "blocked" ? "#B91C22" : "#1E6B3C";
            return (
              <BoardDropColumn key={group.id} id={group.id} label={group.label} count={groupMissions.length} tone={tone} active={group.id === "now"}>
                {groupMissions.length > 0 ? groupMissions.map((mission) => (
                  <BoardCard key={mission.id} mission={mission} isCompleted={group.id === "completed"} onSelect={onSelect} />
                )) : <EmptyState title="Suelta una misión aquí" />}
              </BoardDropColumn>
            );
          })}
        </div>
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
        {activeMissionId ? <BoardDragPreview mission={missions.find((item) => item.id === activeMissionId)} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function BoardDropColumn({ id, label, count, tone, active, children }: { id: TlozMissionStatus; label: string; count: number; tone: string; active: boolean; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: `status:${id}`, data: { status: id } });
  return (
    <div ref={setNodeRef} className="tloz-board-column" data-over={isOver}>
      <div className="flex flex-col" style={{ maxHeight: "100%" }}>
        <div className="flex items-center gap-[9px] px-[6px] pb-3 pt-1">
          <span
            className="size-[9px] shrink-0 rounded-full"
            style={{ background: tone, animation: active ? "nowpulse 1.8s ease-in-out infinite" : undefined }}
          />
          <span className="text-[13px] font-bold tracking-[0.02em]">{label}</span>
          <span className="rounded-full bg-[#F1F0EE] px-[8px] py-[1px] font-mono text-[11px] font-medium text-[#6B6B6B]">{count}</span>
        </div>
        <div className="tloz-droplist flex min-h-[84px] flex-1 flex-col gap-3 overflow-auto pb-2 pl-0.5 pr-0.5" data-group={id} data-over={isOver}>
          {children}
        </div>
      </div>
    </div>
  );
}

function BoardCard({ mission, isCompleted, onSelect }: { mission: TlozMissionRecord; isCompleted: boolean; onSelect?: (m: TlozMissionRecord) => void }) {
  const tone = missionTypeTone[mission.type];
  const blocked = mission.requiredQuestItems.some((item) => item.status !== "unlocked") || mission.dependencies.length > 0;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: mission.id,
    data: { title: mission.title, status: mission.status },
  });
  const dragStyle: CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : {};

  return (
    <div
      ref={setNodeRef}
      className="tloz-kcard"
      style={{
        ...dragStyle,
        background: isCompleted ? "#FBFBFA" : "#fff",
        border: `1px solid ${isCompleted ? "rgba(29,29,27,0.08)" : "rgba(29,29,27,0.10)"}`,
        borderRadius: "14px",
        padding: "14px 14px 14px 22px",
        boxShadow: "0 4px 14px rgba(29,29,27,0.04)",
        opacity: isDragging ? 0 : isCompleted ? 0.82 : 1,
        position: "relative",
        zIndex: isDragging ? 5 : undefined,
      }}
      data-dragging={isDragging}
      onClick={() => onSelect?.(mission)}
      onKeyDown={(event) => {
        if (event.currentTarget !== event.target) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.(mission);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <button
        type="button"
        className="absolute bottom-3 left-1 top-3 w-3 touch-none cursor-grab rounded-full border-0 bg-carbon/[0.06] p-0 transition-colors hover:bg-carbon/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zivelo active:cursor-grabbing"
        aria-label={`Mantén presionado para mover ${mission.title}`}
        {...attributes}
        {...listeners}
      />
      <div className="flex items-center justify-between gap-2" style={{ marginBottom: "10px" }}>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-[9px] py-[3px] text-[10.5px] font-bold"
          style={{ background: typeBadgeBg[mission.type], color: typeBadgeText[mission.type] }}
        >
          {mission.type === "main_quest" ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.4l2.64 5.35 5.9.86-4.27 4.16 1.01 5.88L12 15.73l-5.28 2.78 1.01-5.88L3.46 8.6l5.9-.86z" /></svg>
          ) : mission.type === "exploration_quest" ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polygon points="15.6 8.4 13.4 13.4 8.4 15.6 10.6 10.6" fill="currentColor" stroke="none" /></svg>
          ) : mission.type === "side_quest" ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></svg>
          )}
          {missionTypeLabel[mission.type]}
        </span>
        <div className="flex items-center gap-1.5">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#E6F4EA] px-[8px] py-[2px] text-[10.5px] font-bold text-[#1E6B3C]">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </span>
          ) : null}
        </div>
      </div>
      <div
        style={{
          fontSize: "14px",
          fontWeight: 600,
          lineHeight: 1.3,
          marginBottom: isCompleted ? 0 : "11px",
          textDecoration: isCompleted ? "line-through" : "none",
          textDecorationColor: isCompleted ? "rgba(29,29,27,0.25)" : undefined
        }}
      >
        {mission.title}
      </div>
      {!isCompleted && (
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-[5px] text-[11px] font-medium text-[#6B6B6B]">
            <span className="inline-block size-[6px] shrink-0 rounded-[2px]" style={{ background: mission.project?.color || "#999" }} />
            {mission.displayId}
          </span>
          <div className="flex items-center gap-[6px]">
            {blocked && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-[3px] rounded-full bg-[#FFF4DE] px-[7px] py-[2px] text-[10px] font-semibold text-[#7A5A12]">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    {mission.dependencies.length + mission.requiredQuestItems.filter(i => i.status !== "unlocked").length}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  {mission.dependencies.length + mission.requiredQuestItems.filter(i => i.status !== "unlocked").length} dependencias
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="size-6 rounded-full">
                  <AvatarImage src={mission.owner.avatarUrl} alt="" />
                  <AvatarFallback className="bg-carbon text-[0.55rem] font-medium text-white">
                    {mission.owner.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="top">@{mission.owner.username ? displayUsername(mission.owner.username) : mission.owner.name}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
}

function BoardDragPreview({ mission }: { mission?: TlozMissionRecord }) {
  if (!mission) return null;
  return <div className="w-[280px] rotate-1 rounded-[14px] border border-carbon/10 bg-white px-4 py-3 shadow-2xl">
    <p className="m-0 text-[10px] font-bold uppercase text-carbon/45">{mission.displayId}</p>
    <p className="mb-3 mt-1 text-sm font-semibold">{mission.title}</p>
  </div>;
}

// ─── CALENDAR ──────────────────────────────────────────────────────

export function MissionCalendar({ missions, onSelect }: { missions: TlozMissionRecord[]; onSelect?: (m: TlozMissionRecord) => void }) {
  const datedMissions = missions
    .filter((mission) => mission.dueDate)
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));

  return (
    <section className="tloz-calendar" aria-label="Calendario de Missions">
      {datedMissions.map((mission) => (
        <div
          key={mission.id}
          className="tloz-calendar-item"
          style={{ cursor: "pointer" }}
          onClick={() => onSelect?.(mission)}
        >
          <span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4.5" width="18" height="17" rx="2" /><line x1="3" y1="9.5" x2="21" y2="9.5" /><line x1="8" y1="2.5" x2="8" y2="6.5" />
            </svg>
            {formatDate(mission.dueDate)}
          </span>
          <strong>{mission.title}</strong>
          <em>{mission.project?.name ?? "Sin proyecto"}</em>
          <Badge style={{ backgroundColor: missionTypeTone[mission.type], color: "#fff" }}>{missionTypeLabel[mission.type]}</Badge>
        </div>
      ))}
    </section>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────

export function EmptyTlozState({ title, description }: { title: string; description: string }) {
  return (
    <div className="tloz-empty-state">
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}
