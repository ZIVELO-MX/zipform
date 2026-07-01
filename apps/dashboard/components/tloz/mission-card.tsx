"use client";

import Link from "next/link";
import {
  CircleDot,
  CheckCircle2,
  LucideIcon,
  Plus
} from "lucide-react";
import { Avatar, AvatarFallback, Badge, Button, Card, CardContent, CardHeader, CardTitle, ToneBadge, Tooltip, TooltipContent, TooltipTrigger, UserAvatarLabel } from "@zipform/ui";
import type { TlozMissionRecord } from "../../lib/tloz-data";
import type { UserProfile } from "@zipform/types";
import { dependencyLabel, formatDate, missionPreviewDescription, missionStatusLabel, missionTypeLabel, missionTypeTone, resolveIconLabel, resolveMissionIcon } from "./tloz-utils";

const MAX_VISIBLE_QUEST_ITEMS = 3;

export function MissionCard({ mission, compact = false, onSelect }: { mission: TlozMissionRecord; compact?: boolean; onSelect?: (mission: TlozMissionRecord) => void }) {
  const blocked = mission.requiredQuestItems.some((item) => item.status !== "completed") || mission.dependencies.length > 0;
  const tone = missionTypeTone[mission.type];
  const Icon = resolveMissionIcon(mission.icon);

  return (
    <Card
      className="tloz-mission-card"
      data-mission-type={mission.type}
      style={{ "--mission-tone": tone } as React.CSSProperties}
    >
      <CardHeader>
        <div className="tloz-card-title-row" style={{ display: "flex", gap: "12px" }}>
          <MissionIconAvatar icon={Icon} tone={tone} label={resolveIconLabel(mission.icon)} />
          <div className="min-w-0" style={{ flex: 1 }}>
            <div className="tloz-card-badges" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <ToneBadge tone={{ color: tone }}>
                {missionTypeLabel[mission.type]}
              </ToneBadge>
              <Badge variant="muted">{missionStatusLabel[mission.status]}</Badge>
            </div>
            <CardTitle className="mt-2">
              <a
                href={`/tloz/missions/${mission.id}`}
                onClick={(e) => {
                  if (onSelect) {
                    e.preventDefault();
                    onSelect(mission);
                  }
                }}
                style={{ cursor: onSelect ? "pointer" : undefined }}
              >
                {mission.title}
              </a>
            </CardTitle>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="tloz-card-state" style={{ cursor: "pointer" }}>
                {blocked ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <CircleDot size={16} />
                )}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" align="center">
              {blocked ? "Bloqueada por dependencias" : "Disponible para trabajar"}
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 pt-2">
        {!compact ? <p className="tloz-card-description">{missionPreviewDescription(mission.description)}</p> : null}
        <div className="tloz-meta-row">
          <span>{mission.project?.name ?? "Sin proyecto"}</span>
          <span>{formatDate(mission.dueDate)}</span>
        </div>
        {mission.dependencies.length > 0 ? (
          <div className="tloz-dependency-row">
            {mission.dependencies.slice(0, 3).map((dependency) => (
              <Tooltip key={dependency.id}>
                <TooltipTrigger asChild>
                  <span style={{ cursor: "pointer" }}>
                    <MissionIconAvatar
                      icon={resolveMissionIcon(dependency.icon)}
                      tone={missionTypeTone[dependency.type]}
                      label={dependency.title}
                      tiny
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  {dependency.title}
                </TooltipContent>
              </Tooltip>
            ))}
            <span className="tloz-dependency-copy">{dependencyLabel(mission)}</span>
          </div>
        ) : null}
        <div className="tloz-card-footer">
          <OwnerAvatar user={mission.owner} />
        </div>
      </CardContent>
    </Card>
  );
}

export function ActiveMissionPanel({ label, mission }: { label: string; mission: TlozMissionRecord | null }) {
  return (
    <section className="panel tloz-active-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{label}</p>
          <h3>{mission?.title ?? "Sin Mission asignada"}</h3>
        </div>
        {mission ? <ToneBadge tone={{ color: missionTypeTone[mission.type] }}>{missionTypeLabel[mission.type]}</ToneBadge> : null}
      </div>
      {mission ? (
        <>
          <p>{missionPreviewDescription(mission.description)}</p>
          <div className="tloz-active-actions">
          <OwnerAvatar user={mission.owner} />
            <Button asChild size="sm">
              <Link href={`/tloz/missions/${mission.id}`}>Abrir detalle</Link>
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button variant="outline" size="sm" disabled>
                    Editar
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                Pendiente: edición persistente
              </TooltipContent>
            </Tooltip>
          </div>
        </>
      ) : (
        <p>TODO: definir límites de trabajo activo por usuario.</p>
      )}
    </section>
  );
}

export function MissionIconAvatar({
  icon: Icon,
  tone,
  label,
  tiny = false
}: {
  icon: LucideIcon;
  tone: string;
  label: string;
  tiny?: boolean;
}) {
  return (
    <Avatar className={tiny ? "size-7 rounded-full" : "size-9 rounded-full"} style={{ backgroundColor: tone }}>
      <AvatarFallback aria-label={label} className="bg-transparent text-white">
        <Icon size={tiny ? 14 : 16} />
      </AvatarFallback>
    </Avatar>
  );
}

export function OwnerAvatar({ user }: { user: Pick<UserProfile, "name" | "username" | "avatarUrl"> }) {
  return <UserAvatarLabel className="tloz-owner" name={user.name} label={user.username} imageUrl={user.avatarUrl} />;
}

export function QuestItemDots({ mission, max = MAX_VISIBLE_QUEST_ITEMS }: { mission: TlozMissionRecord; max?: number }) {
  if (mission.questItems.length === 0) return null;

  const visible = mission.questItems.slice(0, max);
  const remaining = mission.questItems.length - max;

  return (
    <span className="tloz-quest-dots" aria-label={`${mission.questItems.length} Quest Items`}>
      {visible.map((item) => (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>
            <span data-status={item.status} style={{ cursor: "pointer" }}>
              {item.icon.slice(0, 1)}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" align="center">
            {item.name}
          </TooltipContent>
        </Tooltip>
      ))}
      {remaining > 0 ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="tloz-quest-overflow">
              <Plus size={10} />
              {remaining}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" align="center">
            {remaining} más
          </TooltipContent>
        </Tooltip>
      ) : null}
    </span>
  );
}
