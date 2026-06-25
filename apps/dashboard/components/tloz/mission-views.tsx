import Link from "next/link";
import { CalendarDays, CheckCircle2, Link2 } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@zipform/ui";
import type { TlozMissionDetail, TlozMissionRecord } from "../../lib/tloz-data";
import type { UserProfile } from "@zipform/types";
import { MissionCard, QuestItemDots } from "./mission-card";
import {
  dependencyLabel,
  formatDate,
  missionStatusLabel,
  missionTypeLabel,
  missionTypeTone,
  resolveIconLabel,
  resolveMissionIcon
} from "./tloz-utils";

const boardGroups = [
  { id: "now", label: "Now" },
  { id: "next", label: "Next" },
  { id: "later", label: "Later" },
  { id: "completed", label: "Completed" }
] as const;

export function MissionList({ missions }: { missions: TlozMissionRecord[] }) {
  return (
    <section className="tloz-list" aria-label="Lista de Missions">
      {missions.map((mission) => {
        const Icon = resolveMissionIcon(mission.icon);
        const tone = missionTypeTone[mission.type];
        return (
          <Link href={`/tloz/missions/${mission.id}`} className="tloz-list-row" key={mission.id}>
            <Avatar className="size-7 rounded-full" style={{ backgroundColor: tone }}>
              <AvatarFallback aria-label={resolveIconLabel(mission.icon)} className="bg-transparent text-white">
                <Icon size={14} />
              </AvatarFallback>
            </Avatar>
            <div>
              <strong>{mission.title}</strong>
              <span>{mission.description}</span>
            </div>
            <Badge style={{ backgroundColor: tone, color: "#fff" }}>{missionTypeLabel[mission.type]}</Badge>
            <span>{mission.project.name}</span>
            <span>{mission.ownerId}</span>
            <span>{formatDate(mission.dueDate)}</span>
            <QuestItemDots mission={mission} />
          </Link>
        );
      })}
    </section>
  );
}

export function MissionTable({ missions }: { missions: TlozMissionRecord[] }) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mission</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Proyecto</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Progreso</TableHead>
            <TableHead>Dependencias</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {missions.map((mission) => {
            const Icon = resolveMissionIcon(mission.icon);
            const tone = missionTypeTone[mission.type];
            return (
              <TableRow key={mission.id}>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    <Avatar className="size-6 rounded-full" style={{ backgroundColor: tone }}>
                      <AvatarFallback aria-label={resolveIconLabel(mission.icon)} className="bg-transparent text-white">
                        <Icon size={12} />
                      </AvatarFallback>
                    </Avatar>
                    <Link href={`/tloz/missions/${mission.id}`}>{mission.title}</Link>
                  </span>
                </TableCell>
                <TableCell>{missionTypeLabel[mission.type]}</TableCell>
                <TableCell>{missionStatusLabel[mission.status]}</TableCell>
                <TableCell>{mission.project.name}</TableCell>
                <TableCell>
                  <Avatar className="size-6 rounded-full">
                    <AvatarImage src={mission.owner.avatarUrl} alt="" />
                    <AvatarFallback className="bg-carbon text-[0.55rem] font-medium text-white">
                      {mission.owner.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>{formatDate(mission.dueDate)}</TableCell>
                <TableCell>
                  <Progress className="h-1.5 w-[72px]" value={mission.progress} />
                </TableCell>
                <TableCell>{dependencyLabel(mission)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

export function MissionBoard({ missions }: { missions: TlozMissionRecord[] }) {
  return (
    <section className="tloz-board" aria-label="Board de Missions">
      {boardGroups.map((group) => {
        const groupMissions = missions.filter((mission) => mission.status === group.id);
        return (
          <div className="tloz-board-column" key={group.id}>
            <div className="tloz-board-heading">
              <h3>{group.label}</h3>
              <Badge variant="muted">{groupMissions.length}</Badge>
            </div>
            <div className="tloz-board-stack">
              {groupMissions.length > 0 ? (
                groupMissions.map((mission) => <MissionCard mission={mission} compact key={mission.id} />)
              ) : (
                <EmptyTlozState title="Sin Missions" description="No hay registros mock para esta columna." />
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

export function MissionCalendar({ missions }: { missions: TlozMissionRecord[] }) {
  const datedMissions = missions
    .filter((mission) => mission.dueDate)
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));

  return (
    <section className="tloz-calendar" aria-label="Calendario de Missions">
      {datedMissions.map((mission) => (
        <Link href={`/tloz/missions/${mission.id}`} className="tloz-calendar-item" key={mission.id}>
          <span>
            <CalendarDays size={16} />
            {formatDate(mission.dueDate)}
          </span>
          <strong>{mission.title}</strong>
          <em>{mission.project.name}</em>
          <Badge style={{ backgroundColor: missionTypeTone[mission.type], color: "#fff" }}>{missionTypeLabel[mission.type]}</Badge>
        </Link>
      ))}
    </section>
  );
}

export function MissionDetailView({ mission }: { mission: TlozMissionDetail }) {
  return (
    <div className="tloz-detail-grid">
      <section className="panel tloz-detail-main">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{missionTypeLabel[mission.type]}</p>
            <h3>{mission.title}</h3>
          </div>
          <Button variant="outline" disabled title="Pendiente: edición persistente">
            Editar
          </Button>
        </div>
        <p>{mission.description}</p>
        <div className="tloz-detail-meta">
          <span>Status: {missionStatusLabel[mission.status]}</span>
          <span>Proyecto: {mission.project.name}</span>
          <span>Owner: {mission.owner.username}</span>
          <span>Due date: {formatDate(mission.dueDate)}</span>
          <span>Season: {mission.season?.name ?? "Sin Season"}</span>
          <span>Episode: {mission.episode?.name ?? "Sin Episode"}</span>
        </div>
        <div>
          <h4>Outcome definition</h4>
          <p>{mission.conclusion ?? "TODO: definir outcome antes de marcar esta Mission como completada."}</p>
        </div>
      </section>

      <aside className="panel tloz-detail-side">
        <h3>Quest Items</h3>
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
            <p>Sin Quest Items.</p>
          )}
        </div>
      </aside>

      <section className="panel">
        <h3>Dependencias</h3>
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
        <h3>Checklist</h3>
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
        <h3>Recursos</h3>
        <div className="task-stack">
          {mission.resources.length > 0 ? (
            mission.resources.map((resource) => (
              <div className="task-card" key={resource.id}>
                <span>{resource.type}</span>
                <strong>
                  <Link2 size={15} />
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
        <h3>Actividad</h3>
        <div className="tloz-activity-placeholder">
          <CheckCircle2 size={18} />
          TODO: definir eventos visibles, retención y diferencia entre actividad y auditoría.
        </div>
      </section>
    </div>
  );
}

export function EmptyTlozState({ title, description }: { title: string; description: string }) {
  return (
    <div className="tloz-empty-state">
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

function DashboardOwnerAvatar({ user }: { user: Pick<UserProfile, "name" | "avatarUrl"> }) {
  const initials = user.name
    .split(/[-_\s]/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Avatar className="size-6 rounded-full">
      <AvatarImage src={user.avatarUrl} alt="" />
      <AvatarFallback className="bg-carbon text-[0.6rem] font-medium text-white">{initials}</AvatarFallback>
    </Avatar>
  );
}

export function DashboardMissionList({
  title,
  subtitle,
  missions
}: {
  title: string;
  subtitle: string;
  missions: TlozMissionRecord[];
}) {
  return (
    <section className="tloz-dashboard-list">
      <div className="tloz-dashboard-list-header">
        <h3>{title}</h3>
        <span>{subtitle}</span>
      </div>
      <div className="tloz-dashboard-list-body">
        {missions.map((mission) => {
          const Icon = resolveMissionIcon(mission.icon);
          const tone = missionTypeTone[mission.type];
          return (
            <Link href={`/tloz/missions/${mission.id}`} className="tloz-dashboard-row" key={mission.id}>
              <Avatar className="size-6 rounded-full" style={{ backgroundColor: tone }}>
                <AvatarFallback aria-label={resolveIconLabel(mission.icon)} className="bg-transparent text-white">
                  <Icon size={12} />
                </AvatarFallback>
              </Avatar>
              <span className="tloz-row-copy">
                <strong>{mission.title}</strong>
                <small>
                  {mission.project.name} · {formatDate(mission.dueDate)}
                </small>
              </span>
              <DashboardOwnerAvatar user={mission.owner} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
