"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import { ExternalLink, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Badge, Button, Progress, Tooltip, TooltipContent, TooltipTrigger } from "@zipform/ui";
import type { TlozMissionRecord } from "../../lib/tloz-data";
import { formatDate, missionStatusLabel, missionTypeLabel, missionTypeTone, resolveIconLabel, resolveMissionIcon } from "./tloz-utils";

type MissionSlideOverProps = {
  mission: TlozMissionRecord | null;
  onClose: () => void;
};

export function MissionSlideOver({ mission, onClose }: MissionSlideOverProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (mission) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mission, handleKeyDown]);

  if (!mission) return null;

  const tone = missionTypeTone[mission.type];
  const Icon = resolveMissionIcon(mission.icon);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          background: "rgba(29,29,27,0.50)",
          animation: "fade-in 0.18s ease"
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          width: "min(520px, 100vw - 48px)",
          background: "#FAFAF9",
          borderLeft: "1px solid rgba(29,29,27,0.10)",
          boxShadow: "-8px 0 32px rgba(29,29,27,0.10)",
          display: "flex",
          flexDirection: "column",
          animation: "pop-in 0.2s ease"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 22px",
            borderBottom: "1px solid rgba(29,29,27,0.08)",
            flexShrink: 0
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#454543", letterSpacing: "0.02em", textTransform: "uppercase" }}>
            Detalle de Mission
          </span>
          <button
            onClick={onClose}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "999px",
              border: "1px solid rgba(29,29,27,0.10)",
              background: "#fff",
              color: "#454543",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all .2s ease"
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="tloz-scrl" style={{ flex: 1, overflow: "auto", padding: "22px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <Badge style={{ backgroundColor: tone, color: "#fff", display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "999px" }}>
                <Icon size={12} />
                {missionTypeLabel[mission.type]}
              </Badge>
              <Badge variant="muted" style={{ fontSize: "11px" }}>{missionStatusLabel[mission.status]}</Badge>
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.2 }}>{mission.title}</h2>
            <p style={{ margin: 0, fontSize: "13.5px", color: "#6B6B6B", lineHeight: 1.6 }}>{mission.description}</p>
          </div>

          <div>
            <div style={{ height: "6px", background: "#F0EFED", borderRadius: "999px", overflow: "hidden", marginBottom: "6px" }}>
              <div style={{ width: `${mission.progress}%`, height: "100%", background: "#D72228", borderRadius: "999px" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "#6B6B6B" }}>
              <span>{mission.progress}% completo</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#1D1D1B" }}>{mission.progress}%</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ background: "#F5F5F5", borderRadius: "11px", padding: "12px" }}>
              <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#9a9a98", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "4px" }}>Proyecto</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#1D1D1B" }}>{mission.project.name}</div>
            </div>
            <div style={{ background: "#F5F5F5", borderRadius: "11px", padding: "12px" }}>
              <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#9a9a98", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "4px" }}>Vence</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: mission.dueDate ? "#B91C22" : "#6B6B6B" }}>{formatDate(mission.dueDate)}</div>
            </div>
            <div style={{ background: "#F5F5F5", borderRadius: "11px", padding: "12px" }}>
              <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#9a9a98", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "4px" }}>Owner</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600 }}>
                <Avatar className="size-6 rounded-full">
                  <AvatarImage src={mission.owner.avatarUrl} alt="" />
                  <AvatarFallback className="bg-carbon text-[0.55rem] font-medium text-white">
                    {mission.owner.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {mission.owner.username}
              </div>
            </div>
            <div style={{ background: "#F5F5F5", borderRadius: "11px", padding: "12px" }}>
              <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#9a9a98", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "4px" }}>Episode</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#1D1D1B" }}>{mission.episode?.name ?? "Sin episode"}</div>
            </div>
          </div>

          {mission.questItems.length > 0 && (
            <div>
              <h3 style={{ margin: "0 0 10px", fontSize: "12.5px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "#454543" }}>
                Quest Items ({mission.questItems.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {mission.questItems.map((item) => (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 12px",
                          background: "#fff",
                          border: "1px solid rgba(29,29,27,0.10)",
                          borderRadius: "11px",
                          cursor: "pointer",
                          transition: "all .2s ease"
                        }}
                        className="tloz-qi-hover"
                      >
                    <span
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: item.status === "completed" ? "#E6F4EA" : "#FFF4DE",
                        color: item.status === "completed" ? "#1E6B3C" : "#7A5A12",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      {item.icon.slice(0, 1)}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                      <div style={{ fontSize: "11px", color: "#9a9a98" }}>{item.description}</div>
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: item.status === "completed" ? "#1E6B3C" : "#7A5A12",
                        background: item.status === "completed" ? "#E6F4EA" : "#FFF4DE",
                        borderRadius: "999px",
                        padding: "3px 8px",
                        flexShrink: 0
                      }}
                    >
                      {item.status === "completed" ? "Desbloqueado" : "Bloqueado"}
                    </span>
                  </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}

          {mission.dependencies.length > 0 && (
            <div>
              <h3 style={{ margin: "0 0 10px", fontSize: "12.5px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "#454543" }}>
                Dependencias ({mission.dependencies.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {mission.dependencies.map((dep) => (
                  <Link
                    key={dep.id}
                    href={`/tloz/missions/${dep.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      background: "#fff",
                      border: "1px solid rgba(29,29,27,0.10)",
                      borderRadius: "11px",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "all .2s ease"
                    }}
                    className="tloz-qi-hover"
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "999px",
                        background: dep.status === "now" ? "#1E8E5A" : dep.status === "next" ? "#3A47B5" : "#9a9a98",
                        flexShrink: 0
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600 }}>{dep.title}</div>
                    </div>
                    <span style={{ fontSize: "10.5px", color: "#9a9a98", flexShrink: 0 }}>
                      {dep.status}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: "16px 22px",
            borderTop: "1px solid rgba(29,29,27,0.08)",
            display: "flex",
            gap: "10px",
            flexShrink: 0
          }}
        >
          <Button asChild style={{ flex: 1, height: "42px", borderRadius: "11px", display: "flex", alignItems: "center", gap: "7px", fontWeight: 600, fontSize: "13.5px" }}>
            <Link href={`/tloz/missions/${mission.id}`}>
              <ExternalLink size={16} />
              Ver detalle completo
            </Link>
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button
                  variant="outline"
                  style={{ height: "42px", borderRadius: "11px", fontWeight: 600, fontSize: "13.5px" }}
                  disabled
                >
                  Editar
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              Pendiente: edición persistente
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </>
  );
}
