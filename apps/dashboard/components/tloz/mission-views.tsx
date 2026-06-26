import Link from "next/link";
import { Plus } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Progress,
} from "@zipform/ui";
import type { TlozMissionRecord } from "../../lib/tloz-data";
import type { UserProfile } from "@zipform/types";
import { QuestItemDots } from "./mission-card";
import {
  formatDate,
  missionStatusLabel,
  missionTypeLabel,
  missionTypeTone,
} from "./tloz-utils";

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
  { id: "completed", label: "Completed" },
] as const;

// ─── DASHBOARD ────────────────────────────────────────────────────

export function DashboardNowSection({ missions, onSelect }: { missions: TlozMissionRecord[]; onSelect?: (m: TlozMissionRecord) => void }) {
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
        {missions.length > 0 ? (
          missions.slice(0, 2).map((mission, i) => (
            <DashboardNowCard key={mission.id} mission={mission} accent={i === 0 ? "#D72228" : "#7A4ED9"} onSelect={onSelect} />
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

function DashboardNowCard({ mission, accent, onSelect }: { mission: TlozMissionRecord; accent: string; onSelect?: (m: TlozMissionRecord) => void }) {
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
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: accent }} />
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
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, color: "#1E8E5A" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: "#1E8E5A", animation: "nowpulse 1.8s ease-in-out infinite" }} />
          Now
        </span>
      </div>
      <h3 style={{ margin: "0 0 7px", fontSize: "19px", fontWeight: 700, letterSpacing: "-0.01em" }}>{mission.title}</h3>
      <p style={{ margin: "0 0 16px", fontSize: "13.5px", color: "#6B6B6B", lineHeight: 1.5, textWrap: "pretty" }}>{mission.description}</p>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#454543", background: "#F5F5F5", borderRadius: "999px", padding: "4px 10px", fontWeight: 500 }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "2px", background: mission.project.color || "#999" }} />
          {mission.project.name}
        </span>
        {mission.episode && (
          <span style={{ fontSize: "12px", color: "#6B6B6B", background: "#F5F5F5", borderRadius: "999px", padding: "4px 10px", fontWeight: 500 }}>
            {mission.episode.name}
          </span>
        )}
      </div>
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", marginBottom: "6px" }}>
          <span style={{ color: "#6B6B6B", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1E8E5A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            {mission.progress}% completo
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#1D1D1B" }}>{mission.progress}%</span>
        </div>
        <div style={{ height: "7px", background: "#F0EFED", borderRadius: "999px", overflow: "hidden" }}>
          <div style={{ width: `${mission.progress}%`, height: "100%", background: "#D72228", borderRadius: "999px" }} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(29,29,27,0.07)", paddingTop: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <Avatar className="size-7 rounded-full">
            <AvatarImage src={mission.owner.avatarUrl} alt="" />
            <AvatarFallback className="bg-carbon text-[0.6rem] font-medium text-white">
              {mission.owner.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: "12.5px", fontWeight: 600 }}>{mission.owner.name}</div>
            <div style={{ fontSize: "11px", color: "#9a9a98" }}>Owner</div>
          </div>
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
            <span style={{ width: "7px", height: "7px", borderRadius: "2px", background: mission.project.color || "#999" }} />
            {mission.project.name}
          </span>
        )}
      </div>
    </div>
  );
}

export function DashboardMainQuests({ missions, onSelect }: { missions: TlozMissionRecord[]; onSelect?: (m: TlozMissionRecord) => void }) {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "13px" }}>
        <h2 style={{ margin: 0, fontSize: "12.5px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#454543", display: "flex", alignItems: "center", gap: "9px" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#D72228"><path d="M12 2.4l2.64 5.35 5.9.86-4.27 4.16 1.01 5.88L12 15.73l-5.28 2.78 1.01-5.88L3.46 8.6l5.9-.86z" /></svg>
          Main Quests
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#9a9a98", background: "#F1F0EE", borderRadius: "999px", padding: "1px 8px", fontWeight: 500 }}>{missions.length}</span>
        </h2>
        <Link href="/tloz/list" style={{ fontSize: "12.5px", color: "#D72228", fontWeight: 600, textDecoration: "none", cursor: "pointer" }}>
          Ver todas →
        </Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
        {missions.slice(0, 3).map((mission) => <DashboardMainQuestCard key={mission.id} mission={mission} onSelect={onSelect} />)}
      </div>
    </section>
  );
}

function DashboardMainQuestCard({ mission, onSelect }: { mission: TlozMissionRecord; onSelect?: (m: TlozMissionRecord) => void }) {
  const tone = missionTypeTone[mission.type];
  const blocked = mission.requiredQuestItems.some((item) => item.status !== "completed") || mission.dependencies.length > 0;
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
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "#FDECEC", color: "#B91C22", fontSize: "10.5px", fontWeight: 700, padding: "3px 9px", borderRadius: "999px" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.4l2.64 5.35 5.9.86-4.27 4.16 1.01 5.88L12 15.73l-5.28 2.78 1.01-5.88L3.46 8.6l5.9-.86z" /></svg>
          Main
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "10.5px", fontWeight: 600, color: statusCfg.textColor }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: statusCfg.dotColor, animation: mission.status === "now" ? "nowpulse 1.8s ease-in-out infinite" : undefined }} />
          {statusCfg.label}
        </span>
      </div>
      <h3 style={{ margin: "0 0 10px", fontSize: "15px", fontWeight: 700, lineHeight: 1.25 }}>{mission.title}</h3>
      <div style={{ display: "flex", gap: "7px", marginBottom: "13px" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#6B6B6B", fontWeight: 500 }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "2px", background: mission.project.color || "#999" }} />
          {mission.project.name}
        </span>
        {mission.episode && (
          <>
            <span style={{ fontSize: "11px", color: "#bcbcba" }}>·</span>
            <span style={{ fontSize: "11px", color: "#6B6B6B", fontWeight: 500 }}>Ep. {mission.episode.romanNumber}</span>
          </>
        )}
      </div>
      <div style={{ height: "6px", background: "#F0EFED", borderRadius: "999px", overflow: "hidden", marginBottom: "13px" }}>
        <div style={{ width: `${mission.progress}%`, height: "100%", background: "#D72228" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Avatar className="size-6 rounded-full">
          <AvatarImage src={mission.owner.avatarUrl} alt="" />
          <AvatarFallback className="bg-carbon text-[0.55rem] font-medium text-white">
            {mission.owner.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {blocked && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "10px", color: "#7A5A12", fontWeight: 600, background: "#FFF4DE", borderRadius: "999px", padding: "2px 7px" }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              {mission.dependencies.length + mission.requiredQuestItems.filter(i => i.status !== "completed").length} item
            </span>
          )}
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#9a9a98" }}>{mission.progress}%</span>
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
                  <div style={{ fontSize: "13.5px", fontWeight: 600 }}>{mission.title}</div>
                  <div style={{ fontSize: "11px", color: "#9a9a98", display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "2px", background: mission.project.color || "#999" }} />
                    {mission.project.name} · {missionTypeLabel[mission.type]}
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

export function DashboardProjectsSection({ projects, missions }: { projects: Array<{ id: string; name: string; color: string; totalMissions: number; nowMissions: number; completedMissions: number }>; missions: TlozMissionRecord[] }) {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "13px" }}>
        <h2 style={{ margin: 0, fontSize: "12.5px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#454543" }}>Proyectos</h2>
        <a style={{ fontSize: "12.5px", color: "#D72228", fontWeight: 600, textDecoration: "none", cursor: "pointer" }}>Ver todos →</a>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "13px" }}>
        {projects.map((project) => {
          const projectMissions = missions.filter((m) => m.projectId === project.id);
          const ownerSet = new Set(projectMissions.map(m => m.owner.id));
          const uniqueOwners = Array.from(ownerSet).slice(0, 3);
          return (
            <div
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
              <div style={{ height: "6px", background: "#F0EFED", borderRadius: "999px", overflow: "hidden", marginBottom: "12px" }}>
                <div style={{ width: `${project.totalMissions > 0 ? (project.completedMissions / project.totalMissions) * 100 : 0}%`, height: "100%", background: project.color }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex" }}>
                  {uniqueOwners.map((ownerId) => {
                    const owner = projectMissions.find(m => m.owner.id === ownerId)?.owner;
                    if (!owner) return null;
                    return (
                      <Avatar key={ownerId} className="size-5 rounded-full" style={{ border: "1.5px solid #fff", marginLeft: uniqueOwners.indexOf(ownerId) > 0 ? "-7px" : 0 }}>
                        <AvatarImage src={owner.avatarUrl} alt="" />
                        <AvatarFallback className="bg-carbon text-[0.45rem] font-medium text-white">
                          {owner.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    );
                  })}
                </div>
                <span style={{ fontSize: "11px", color: "#6B6B6B", fontWeight: 500 }}>{project.nowMissions} activa{project.nowMissions !== 1 ? "s" : ""}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function DashboardQuestItemsSection({ questItems }: { questItems: Array<{ id: string; name: string; description: string; icon: string; status: string }> }) {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "13px" }}>
        <h2 style={{ margin: 0, fontSize: "12.5px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#454543", display: "flex", alignItems: "center", gap: "9px" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7A5A12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Quest Items
          <span style={{ fontSize: "11px", color: "#6B6B6B", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>
            desbloqueos reutilizables
          </span>
        </h2>
        <a style={{ fontSize: "12.5px", color: "#D72228", fontWeight: 600, textDecoration: "none", cursor: "pointer" }}>Gestionar →</a>
      </div>
      <div className="tloz-scrl" style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "4px" }}>
        {questItems.map((item) => (
          <div
            key={item.id}
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
            title={item.name}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "9px",
                  background: item.status === "completed" ? "#E6F4EA" : "#FFF4DE",
                  color: item.status === "completed" ? "#1E6B3C" : "#7A5A12",
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
                  color: item.status === "completed" ? "#1E6B3C" : "#7A5A12",
                  background: item.status === "completed" ? "#E6F4EA" : "#FFF4DE",
                  borderRadius: "999px",
                  padding: "3px 8px"
                }}
              >
                {item.status === "completed" ? "Desbloqueado" : "Bloqueado"}
              </span>
            </div>
            <div style={{ fontWeight: 600, fontSize: "13.5px", marginBottom: "3px" }}>{item.name}</div>
            <div style={{ fontSize: "11px", color: "#9a9a98" }}>{item.description}</div>
          </div>
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
        {activities.map((activity, i) => (
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
        ))}
      </div>
    </div>
  );
}

// ─── TABLE ─────────────────────────────────────────────────────────

export function MissionTable({ missions, onSelect }: { missions: TlozMissionRecord[]; onSelect?: (m: TlozMissionRecord) => void }) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(29,29,27,0.10)", borderRadius: "14px", overflow: "hidden", minWidth: "920px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ textAlign: "left" }}>
            {["Mission", "Estado", "Tipo", "Proyecto", "Owner", "Ep.", "Progreso", "Vence"].map((label) => (
              <th
                key={label}
                className="tloz-th"
                style={{
                  padding: "11px 14px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "#9a9a98",
                  borderBottom: "1px solid rgba(29,29,27,0.10)",
                  ...(label === "Vence" ? { textAlign: "right" as const } : {}),
                  ...(label === "Progreso" ? { width: "150px" } : {})
                }}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {missions.map((mission) => {
            const tone = missionTypeTone[mission.type];
            const statusCfg = statusConfig[mission.status === "blocked" ? "now" : mission.status];
            return (
              <tr
                key={mission.id}
                className="tloz-trow"
                style={{ cursor: "pointer", borderBottom: "1px solid rgba(29,29,27,0.06)" }}
                onClick={() => onSelect?.(mission)}
              >
                <td style={{ padding: "11px 14px", fontWeight: 600 }}>{mission.title}</td>
                <td style={{ padding: "11px 14px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: statusCfg.textColor }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: statusCfg.dotColor, animation: mission.status === "now" ? "nowpulse 1.8s ease-in-out infinite" : undefined }} />
                    {statusCfg.label}
                  </span>
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: tone,
                      background: tone === "#d72228" ? "#FDECEC" : tone === "#2d6cdf" ? "#EEF2FF" : tone === "#1e8e5a" ? "#E6F4EA" : "#F2EAFE",
                      borderRadius: "999px",
                      padding: "3px 9px"
                    }}
                  >
                    {missionTypeLabel[mission.type]}
                  </span>
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#454543" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "2px", background: mission.project.color || "#999" }} />
                    {mission.project.name}
                  </span>
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
                    <Avatar className="size-5 rounded-full">
                      <AvatarImage src={mission.owner.avatarUrl} alt="" />
                      <AvatarFallback className="bg-carbon text-[0.5rem] font-medium text-white">
                        {mission.owner.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span style={{ fontSize: "12px", color: "#454543" }}>{mission.owner.username}</span>
                  </span>
                </td>
                <td style={{ padding: "11px 14px", color: "#6B6B6B", fontSize: "12px" }}>
                  {mission.episode?.romanNumber ?? "—"}
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ flex: 1, height: "6px", background: "#F0EFED", borderRadius: "999px", overflow: "hidden" }}>
                      <span style={{ display: "block", width: `${mission.progress}%`, height: "100%", background: "#D72228" }} />
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#9a9a98" }}>{mission.progress}%</span>
                  </span>
                </td>
                <td style={{ padding: "11px 14px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", color: mission.dueDate ? "#B91C22" : "#9a9a98" }}>
                  {formatDate(mission.dueDate)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── LIST ──────────────────────────────────────────────────────────

export function MissionList({ missions, onSelect }: { missions: TlozMissionRecord[]; onSelect?: (m: TlozMissionRecord) => void }) {
  const groups = [
    { id: "now", label: "Now", missions: missions.filter((m) => m.status === "now" || m.status === "blocked") },
    { id: "next", label: "Next", missions: missions.filter((m) => m.status === "next") },
    { id: "later", label: "Later", missions: missions.filter((m) => m.status === "later") },
  ] as const;

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
      {groups.map((group) => {
        if (group.missions.length === 0) return null;
        const statusCfg = statusConfig[group.id];

        return (
          <div key={group.id} style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "13px 16px 9px" }}>
              <span style={{
                width: "9px",
                height: "9px",
                borderRadius: "999px",
                background: statusCfg.dotColor,
                animation: group.id === "now" ? "nowpulse 1.8s ease-in-out infinite" : undefined
              }} />
              <span style={{ fontWeight: 700, fontSize: "13px" }}>{group.label}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#6B6B6B", background: "#F1F0EE", borderRadius: "999px", padding: "1px 8px", fontWeight: 500 }}>
                {group.missions.length}
              </span>
            </div>
            <div style={{ background: "#fff", border: "1px solid rgba(29,29,27,0.10)", borderRadius: "14px", overflow: "hidden" }}>
              {group.missions.map((mission, idx) => {
                const tone = missionTypeTone[mission.type];
                const blocked = mission.requiredQuestItems.some((item) => item.status !== "completed") || mission.dependencies.length > 0;
                const isLast = idx === group.missions.length - 1;

                return (
                  <div
                    key={mission.id}
                    className="tloz-lrow"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0,1fr) 130px 110px 132px 96px",
                      gap: "14px",
                      alignItems: "center",
                      padding: "13px 16px",
                      cursor: "pointer",
                      borderBottom: isLast ? "none" : "1px solid rgba(29,29,27,0.06)"
                    }}
                    onClick={() => onSelect?.(mission)}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                      <span
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "7px",
                          background: tone === "#d72228" ? "#FDECEC" : tone === "#2d6cdf" ? "#EEF2FF" : tone === "#1e8e5a" ? "#E6F4EA" : "#F2EAFE",
                          color: tone,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          fontSize: "11px",
                          fontWeight: 700
                        }}
                      >
                        {mission.type === "main_quest" ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.4l2.64 5.35 5.9.86-4.27 4.16 1.01 5.88L12 15.73l-5.28 2.78 1.01-5.88L3.46 8.6l5.9-.86z" /></svg>
                        ) : mission.type === "exploration_quest" ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polygon points="15.6 8.4 13.4 13.4 8.4 15.6 10.6 10.6" fill="currentColor" stroke="none" /></svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
                        )}
                      </span>
                      <span style={{ fontSize: "13.5px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {mission.title}
                      </span>
                      {blocked && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "9.5px", fontWeight: 600, color: "#7A5A12", background: "#FFF4DE", borderRadius: "999px", padding: "2px 7px", flexShrink: 0 }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          {mission.dependencies.length + mission.requiredQuestItems.filter(i => i.status !== "completed").length}
                        </span>
                      )}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6B6B6B", fontWeight: 500 }}>
                      <span style={{ width: "7px", height: "7px", borderRadius: "2px", background: mission.project.color || "#999" }} />
                      {mission.project.name}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
                      <Avatar className="size-5 rounded-full">
                        <AvatarImage src={mission.owner.avatarUrl} alt="" />
                        <AvatarFallback className="bg-carbon text-[0.5rem] font-medium text-white">
                          {mission.owner.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span style={{ fontSize: "12px", color: "#454543" }}>{mission.owner.username}</span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ flex: 1, height: "6px", background: "#F0EFED", borderRadius: "999px", overflow: "hidden" }}>
                        <span style={{ display: "block", width: `${mission.progress}%`, height: "100%", background: "#D72228" }} />
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#9a9a98" }}>{mission.progress}%</span>
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", fontWeight: 500, textAlign: "right", color: mission.dueDate ? "#B91C22" : "#9a9a98" }}>
                      {formatDate(mission.dueDate)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── BOARD ─────────────────────────────────────────────────────────

export function MissionBoard({ missions, onSelect }: { missions: TlozMissionRecord[]; onSelect?: (m: TlozMissionRecord) => void }) {
  return (
    <div className="tloz-scrl" style={{ display: "flex", gap: "16px", alignItems: "flex-start", minWidth: "min-content", height: "100%", paddingBottom: "8px" }}>
      {boardGroups.map((group) => {
        const groupMissions = missions.filter((mission) => mission.status === group.id);
        const isCompleted = group.id === "completed";

        return (
          <div key={group.id} style={{ flex: "0 0 296px", display: "flex", flexDirection: "column", maxHeight: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "4px 6px 12px" }}>
              <span
                style={{
                  width: "9px",
                  height: "9px",
                  borderRadius: "999px",
                  background: group.id === "now" ? "#1E8E5A" : group.id === "next" ? "#3A47B5" : group.id === "later" ? "#9a9a98" : "#1E6B3C",
                  animation: group.id === "now" ? "nowpulse 1.8s ease-in-out infinite" : undefined
                }}
              />
              <span style={{ fontWeight: 700, fontSize: "13px", letterSpacing: "0.02em" }}>{group.label}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#6B6B6B", background: "#F1F0EE", borderRadius: "999px", padding: "1px 8px", fontWeight: 500 }}>
                {groupMissions.length}
              </span>
              <span style={{ marginLeft: "auto", fontSize: "14px", color: "#bcbcba", cursor: "pointer" }}>+</span>
            </div>
            <div
              className="tloz-droplist"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "11px",
                overflow: "auto",
                padding: "2px 2px 8px",
                minHeight: "60px",
                flex: 1
              }}
              data-group={group.id}
            >
              {groupMissions.length > 0 ? (
                groupMissions.map((mission) => (
                  <BoardCard key={mission.id} mission={mission} isCompleted={isCompleted} onSelect={onSelect} />
                ))
              ) : (
                <div style={{ padding: "20px", textAlign: "center", color: "#9a9a98", fontSize: "12px" }}>
                  Sin missions
                </div>
              )}
            </div>
          </div>
        );
      })}

      <button
        className="tloz-addc"
        style={{
          flex: "0 0 240px",
          alignSelf: "flex-start",
          marginTop: "30px",
          height: "46px",
          background: "transparent",
          border: "1.5px dashed rgba(29,29,27,0.16)",
          borderRadius: "14px",
          color: "#9a9a98",
          fontFamily: "inherit",
          fontWeight: 600,
          fontSize: "13px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "7px",
          cursor: "pointer",
          transition: "all .2s ease"
        }}
        disabled
        title="Pendiente: crear columna"
      >
        <Plus size={16} />
        Añadir columna
      </button>
    </div>
  );
}

function BoardCard({ mission, isCompleted, onSelect }: { mission: TlozMissionRecord; isCompleted: boolean; onSelect?: (m: TlozMissionRecord) => void }) {
  const tone = missionTypeTone[mission.type];
  const blocked = mission.requiredQuestItems.some((item) => item.status !== "completed") || mission.dependencies.length > 0;

  return (
    <div
      className="tloz-kcard"
      draggable="true"
      style={{
        background: isCompleted ? "#FBFBFA" : "#fff",
        border: `1px solid ${isCompleted ? "rgba(29,29,27,0.08)" : "rgba(29,29,27,0.10)"}`,
        borderRadius: "14px",
        padding: "14px",
        boxShadow: "0 4px 14px rgba(29,29,27,0.04)",
        opacity: isCompleted ? 0.82 : 1,
        cursor: "grab"
      }}
      onClick={(e) => {
        e.preventDefault();
        if (e.target === e.currentTarget || (e.target as HTMLElement).closest(".tloz-kcard")) {
          onSelect?.(mission);
        }
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            background: tone === "#d72228" ? "#FDECEC" : tone === "#2d6cdf" ? "#EEF2FF" : tone === "#1e8e5a" ? "#E6F4EA" : "#F2EAFE",
            color: tone,
            fontSize: "10.5px",
            fontWeight: 700,
            padding: "3px 9px",
            borderRadius: "999px"
          }}
        >
          {missionTypeLabel[mission.type]}
        </span>
        {isCompleted ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10.5px", color: "#1E6B3C", fontWeight: 700, background: "#E6F4EA", borderRadius: "999px", padding: "2px 8px" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </span>
        ) : (
          <span
            style={{
              fontSize: "10.5px",
              color: "#7A5A12",
              background: "#FFF4DE",
              borderRadius: "999px",
              padding: "3px 8px",
              fontWeight: 600
            }}
          >
            {missionTypeLabel[mission.type] === "Main Quest" ? "Basic" : "—"}
          </span>
        )}
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
        <>
          <div style={{ height: "6px", background: "#F0EFED", borderRadius: "999px", overflow: "hidden", marginBottom: "11px" }}>
            <div style={{ width: `${mission.progress}%`, height: "100%", background: "#D72228" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#6B6B6B", fontWeight: 500 }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "2px", background: mission.project.color || "#999" }} />
              {mission.project.name}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {blocked && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#7A5A12", fontWeight: 600, background: "#FFF4DE", borderRadius: "999px", padding: "2px 7px" }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  {mission.dependencies.length + mission.requiredQuestItems.filter(i => i.status !== "completed").length}
                </span>
              )}
              <Avatar className="size-[23px] rounded-full">
                <AvatarImage src={mission.owner.avatarUrl} alt="" />
                <AvatarFallback className="bg-carbon text-[0.5rem] font-medium text-white">
                  {mission.owner.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </>
      )}
    </div>
  );
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
          <em>{mission.project.name}</em>
          <Badge style={{ backgroundColor: missionTypeTone[mission.type], color: "#fff" }}>{missionTypeLabel[mission.type]}</Badge>
        </div>
      ))}
    </section>
  );
}

// ─── MISSION DETAIL VIEW ──────────────────────────────────────────

export function MissionDetailView({ mission }: { mission: import("../../lib/tloz-data").TlozMissionDetail }) {
  const tone = missionTypeTone[mission.type];
  return (
    <div style={{ padding: "24px 26px 48px", maxWidth: "1180px", margin: "0 auto" }}>
      <div className="tloz-detail-grid">
        <section className="panel tloz-detail-main">
          <div className="panel-heading">
            <div>
              <p className="eyebrow" style={{ color: tone }}>{missionTypeLabel[mission.type]}</p>
              <h3>{mission.title}</h3>
            </div>
            <button
              className="tloz-pbtn"
              disabled
              title="Pendiente: edición persistente"
              style={{
                height: "36px",
                padding: "0 14px",
                borderRadius: "999px",
                border: "1px solid rgba(29,29,27,0.10)",
                background: "#fff",
                color: "#454543",
                fontFamily: "inherit",
                fontWeight: 600,
                fontSize: "12.5px",
                cursor: "pointer",
                transition: "all .2s ease"
              }}
            >
              Editar
            </button>
          </div>
          <p style={{ color: "#6B6B6B", lineHeight: 1.6 }}>{mission.description}</p>
          <div className="tloz-detail-meta">
            <span>Status: {missionStatusLabel[mission.status]}</span>
            <span>Proyecto: {mission.project.name}</span>
            <span>Owner: {mission.owner.username}</span>
            <span>Due date: {formatDate(mission.dueDate)}</span>
            <span>Season: {mission.season?.name ?? "Sin Season"}</span>
            <span>Episode: {mission.episode?.name ?? "Sin Episode"}</span>
          </div>
          <div>
            <h4 style={{ marginBottom: "8px", fontSize: "14px", fontWeight: 700 }}>Outcome definition</h4>
            <p style={{ color: "#6B6B6B", lineHeight: 1.6 }}>
              {mission.conclusion ?? "TODO: definir outcome antes de marcar esta Mission como completada."}
            </p>
          </div>
        </section>

        <aside className="panel tloz-detail-side" style={{ alignSelf: "start" }}>
          <h3 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 700 }}>Quest Items</h3>
          <div className="tloz-quest-list">
            {mission.questItems.length > 0 ? (
              mission.questItems.map((item) => {
                const required = mission.requiredQuestItems.some((requiredItem) => requiredItem.id === item.id);
                return (
                  <span key={item.id} data-status={item.status}>
                    <strong>{item.name}</strong>
                    <small>{required ? "Required" : "Optional"}</small>
                  </span>
                );
              })
            ) : (
              <p style={{ color: "#9a9a98" }}>Sin Quest Items.</p>
            )}
          </div>
        </aside>

        <section className="panel">
          <h3 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 700 }}>Dependencias</h3>
          {mission.dependencies.length > 0 ? (
            <div className="task-stack">
              {mission.dependencies.map((dependency) => (
                <Link href={`/tloz/missions/${dependency.id}`} className="task-card" key={dependency.id}>
                  <span>{missionStatusLabel[dependency.status]}</span>
                  <strong>{dependency.title}</strong>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyTlozState title="Sin dependencias" description="Esta Mission puede avanzar sin bloqueos mock." />
          )}
        </section>

        <section className="panel">
          <h3 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 700 }}>Checklist</h3>
          <div className="tloz-checklist">
            {mission.checklist.length > 0 ? (
              mission.checklist.map((item) => (
                <label key={item.id}>
                  <input type="checkbox" checked={item.completed} readOnly />
                  <span>{item.title}</span>
                </label>
              ))
            ) : (
              <EmptyTlozState title="Sin checklist" description="TODO: definir creación y edición de checklist." />
            )}
          </div>
        </section>

        <section className="panel">
          <h3 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 700 }}>Recursos</h3>
          <div className="task-stack">
            {mission.resources.length > 0 ? (
              mission.resources.map((resource) => (
                <div className="task-card" key={resource.id}>
                  <span>{resource.type}</span>
                  <strong>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px", verticalAlign: "middle" }}>
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    {resource.title}
                  </strong>
                </div>
              ))
            ) : (
              <EmptyTlozState title="Sin recursos" description="TODO: definir uploads, permisos y almacenamiento." />
            )}
          </div>
        </section>

        <section className="panel">
          <h3 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 700 }}>Actividad</h3>
          <div className="tloz-activity-placeholder">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            TODO: definir eventos visibles, retención y diferencia entre actividad y auditoría.
          </div>
        </section>
      </div>
    </div>
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


