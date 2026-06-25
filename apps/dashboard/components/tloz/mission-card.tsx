import Link from "next/link";
import {
  CircleDot,
  CheckCircle2,
  LucideIcon,
  Plus
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Badge, Button, Card, CardContent, CardHeader, CardTitle, Progress, Tooltip, TooltipContent, TooltipTrigger } from "@zipform/ui";
import type { TlozMissionRecord } from "../../lib/tloz-data";
import type { UserProfile } from "@zipform/types";
import { dependencyLabel, formatDate, missionStatusLabel, missionTypeLabel, missionTypeTone, resolveIconLabel, resolveMissionIcon } from "./tloz-utils";

const MAX_VISIBLE_QUEST_ITEMS = 3;

export function MissionCard({ mission, compact = false }: { mission: TlozMissionRecord; compact?: boolean }) {
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Badge style={{ backgroundColor: tone, color: "#fff" }}>
                      {missionTypeLabel[mission.type]}
                    </Badge>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{missionTypeTone[mission.type]}</TooltipContent>
              </Tooltip>
              <Badge variant="muted">{missionStatusLabel[mission.status]}</Badge>
            </div>
            <CardTitle className="mt-2">
              <Link href={`/tloz/missions/${mission.id}`}>{mission.title}</Link>
            </CardTitle>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                {blocked ? (
                  <span className="tloz-card-state" title="Bloqueada">
                    <CheckCircle2 size={16} />
                  </span>
                ) : (
                  <span className="tloz-card-state subtle" title="Disponible">
                    <CircleDot size={16} />
                  </span>
                )}
              </span>
            </TooltipTrigger>
            <TooltipContent>{blocked ? "Bloqueada por dependencias" : "Disponible para trabajar"}</TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 pt-2">
        {!compact ? <p className="tloz-card-description">{mission.description}</p> : null}
        <div className="tloz-meta-row">
          <span>{mission.project.name}</span>
          <span>{formatDate(mission.dueDate)}</span>
        </div>
        {mission.dependencies.length > 0 ? (
          <div className="tloz-dependency-row">
            {mission.dependencies.slice(0, 3).map((dependency) => (
              <Tooltip key={dependency.id}>
                <TooltipTrigger asChild>
                  <span>
                    <MissionIconAvatar
                      icon={resolveMissionIcon(dependency.icon)}
                      tone={missionTypeTone[dependency.type]}
                      label={dependency.title}
                      tiny
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{dependency.title}</TooltipContent>
              </Tooltip>
            ))}
            <span className="tloz-dependency-copy">{dependencyLabel(mission)}</span>
          </div>
        ) : null}
        <Progress className="tloz-progress" value={mission.progress} />
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
        {mission ? <Badge style={{ backgroundColor: missionTypeTone[mission.type], color: "#fff" }}>{missionTypeLabel[mission.type]}</Badge> : null}
      </div>
      {mission ? (
        <>
          <p>{mission.description}</p>
          <div className="tloz-active-actions">
          <OwnerAvatar user={mission.owner} />
            <Button asChild size="sm">
              <Link href={`/tloz/missions/${mission.id}`}>Abrir detalle</Link>
            </Button>
            <Button variant="outline" size="sm" disabled title="Pendiente: edición persistente">
              Editar
            </Button>
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
  const initials = user.name
    .split(/[-_\s]/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="tloz-owner">
      <Avatar className="size-7 rounded-full">
        <AvatarImage src={user.avatarUrl} alt="" />
        <AvatarFallback className="bg-carbon text-[0.65rem] font-medium text-white">{initials}</AvatarFallback>
      </Avatar>
      <span>{user.username}</span>
    </span>
  );
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
            <span data-status={item.status}>
              {item.icon.slice(0, 1)}
            </span>
          </TooltipTrigger>
          <TooltipContent>{item.name}</TooltipContent>
        </Tooltip>
      ))}
      {remaining > 0 ? (
        <span className="tloz-quest-overflow" title={`${remaining} más`}>
          <Plus size={10} />
          {remaining}
        </span>
      ) : null}
    </span>
  );
}

