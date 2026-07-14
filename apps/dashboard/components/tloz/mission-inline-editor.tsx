"use client";

import { useEffect, useState, useTransition } from "react";
import { DatePicker, displayUsername, EntityPicker, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, toast, useOverlayToasterId, UserAvatarLabel, UserPicker } from "@zipform/ui";
import type { TlozMissionUpdateInput } from "@zipform/data";
import type { TlozMissionRecord } from "../../lib/tloz-data";
import type { TlozMissionStatus, TlozMissionType } from "@zipform/types";
import { createProject, patchMissionStatus, updateMission } from "../../app/tloz/actions";
import { formatDate, missionStatusLabel, missionStatusTone, missionTypeLabel, missionTypeTone, resolveMissionIcon } from "./tloz-utils";
import { DetailPropertyRow } from "./detail-property-row";

export type MissionEditorOptions = {
  projects: Array<{ id: string; name: string; description?: string; color?: string; icon?: string }>;
  seasons?: Array<{ id: string; name: string; description?: string }>;
  episodes: Array<{ id: string; name: string; seasonId: string; description?: string }>;
  users: Array<{ id: string; name: string; username?: string; avatarUrl?: string }>;
  missions?: Array<{ id: string; projectId?: string; seasonId?: string }>;
};

export type MissionPropertyValues = {
  status: TlozMissionStatus;
  type: TlozMissionType;
  ownerId: string;
  projectId?: string;
  startDate?: string;
  dueDate?: string;
};

const statuses: TlozMissionStatus[] = ["now", "next", "later", "blocked", "completed"];
const missionTypes: TlozMissionType[] = ["main_quest", "side_quest", "farming_quest", "exploration_quest"];

export function MissionInlineEditor({ mission, options, onMissionChange }: { mission: TlozMissionRecord; options?: MissionEditorOptions; onMissionChange?: (mission: TlozMissionRecord) => void }) {
  const [current, setCurrent] = useState(mission);
  const [projects, setProjects] = useState(options?.projects ?? []);
  const [isPending, startTransition] = useTransition();
  const toasterId = useOverlayToasterId();

  useEffect(() => setCurrent(mission), [mission]);
  useEffect(() => { setProjects(options?.projects ?? []); }, [options]);

  function apply(updated: TlozMissionRecord) { setCurrent(updated); onMissionChange?.(updated); }
  function persist(input: TlozMissionUpdateInput, success: string) {
    const toastId = toast.loading("Guardando cambios…", { toasterId });
    startTransition(async () => {
      try { apply(await updateMission(current.id, input)); toast.success(success, { id: toastId, toasterId }); }
      catch { toast.error("No se pudieron guardar los cambios", { id: toastId, toasterId }); }
    });
  }
  function changeStatus(value: TlozMissionStatus) {
    const toastId = toast.loading("Actualizando estado…", { toasterId });
    startTransition(async () => {
      try { apply(await patchMissionStatus(current.id, value)); toast.success("Estado actualizado", { id: toastId, toasterId }); }
      catch { toast.error("No se pudo actualizar el estado", { id: toastId, toasterId }); }
    });
  }

  return <MissionPropertyFields values={current} options={options} onChange={(field, value) => field === "status" ? changeStatus(value as TlozMissionStatus) : persist({ [field]: value, ...(field === "projectId" ? { seasonId: "", episodeId: "" } : {}) }, `${field === "type" ? "Tipo" : field === "ownerId" ? "Responsable" : field === "projectId" ? "Proyecto" : "Fecha"} actualizado`)} ariaBusy={isPending} />;
}

export function MissionPropertyFields({ values, options, onChange, ariaBusy = false, layout = "stacked" }: { values: MissionPropertyValues & { owner?: { name: string; username?: string; avatarUrl?: string }; project?: { name: string; color?: string; icon?: string } }; options?: MissionEditorOptions; onChange: (field: keyof MissionPropertyValues, value: string) => void; ariaBusy?: boolean; layout?: "stacked" | "grid" }) {
  const projects = options?.projects ?? [];
  const selectedOwner = options?.users.find((user) => user.id === values.ownerId);
  const selectedProject = projects.find((project) => project.id === values.projectId);
  const status = values.status;
  return <div className={layout === "grid" ? "grid grid-cols-1 gap-1 sm:grid-cols-2" : "flex flex-col"} data-layout={layout} aria-busy={ariaBusy}>
    <DetailPropertyRow label="Estado" display={<StatusValue status={status} />}><Select value={status} onValueChange={(value) => onChange("status", value)}><SelectTrigger aria-label="Estado"><SelectValue><StatusValue status={status} /></SelectValue></SelectTrigger><SelectContent position="item-aligned"><SelectGroup>{statuses.map((value) => <SelectItem key={value} value={value}><StatusValue status={value} /></SelectItem>)}</SelectGroup></SelectContent></Select></DetailPropertyRow>
    <DetailPropertyRow label="Categoría" display={<TypeValue type={values.type} />}><Select value={values.type} onValueChange={(value) => onChange("type", value)}><SelectTrigger aria-label="Tipo"><SelectValue><TypeValue type={values.type} /></SelectValue></SelectTrigger><SelectContent position="item-aligned"><SelectGroup>{missionTypes.map((value) => <SelectItem key={value} value={value}><TypeValue type={value} /></SelectItem>)}</SelectGroup></SelectContent></Select></DetailPropertyRow>
    {options?.users.length ? <DetailPropertyRow label="Responsable" display={<UserAvatarLabel name={values.owner?.name ?? selectedOwner?.name ?? "Sin responsable"} label={values.owner?.username ?? selectedOwner?.username ?? "Sin responsable"} labelOnly imageUrl={values.owner?.avatarUrl ?? selectedOwner?.avatarUrl} size="sm" />}><UserPicker users={options.users} value={values.ownerId} label="Responsable" onValueChange={(value) => onChange("ownerId", value)} /></DetailPropertyRow> : null}
    <DetailPropertyRow label="Proyecto" display={<ProjectValue project={values.project ?? selectedProject} />}><EntityPicker label="Proyecto" options={projects.map((project) => ({ ...project, iconComponent: resolveMissionIcon(project.icon), color: project.color }))} value={values.projectId} onValueChange={(value) => onChange("projectId", value)} /></DetailPropertyRow>
    <DetailPropertyRow label="Inicio" display={<span className="font-mono text-[12.5px] font-semibold">{formatDate(values.startDate)}</span>}><DatePicker value={values.startDate} label="Fecha de inicio" onValueChange={(value) => onChange("startDate", value ?? "")} /></DetailPropertyRow>
    <DetailPropertyRow label="Vence" display={<span className="font-mono text-[12.5px] font-semibold text-[#B91C22]">{formatDate(values.dueDate)}</span>}><DatePicker value={values.dueDate} label="Fecha límite" onValueChange={(value) => onChange("dueDate", value ?? "")} /></DetailPropertyRow>
  </div>;
}

function TypeValue({ type }: { type: TlozMissionType }) { const tone = missionTypeTone[type]; return <span className="inline-flex rounded-full px-[9px] py-[3px] text-xs font-bold" style={{ background: tone === "#d72228" ? "#FDECEC" : tone === "#2d6cdf" ? "#EEF2FF" : tone === "#1e8e5a" ? "#E6F4EA" : "#F2EAFE", color: tone }}>{missionTypeLabel[type]}</span>; }

function ProjectValue({ project }: { project?: { name: string; color?: string; icon?: string } }) { const color = project?.color ?? "#6B6B6B"; const Icon = resolveMissionIcon(project?.icon); return <span className="inline-flex min-w-0 items-center gap-1.5"><span className="grid size-6 shrink-0 place-items-center rounded-md [&_svg]:size-3.5" style={{ backgroundColor: `${color}18`, color }}><Icon aria-hidden="true" /></span><span className="truncate">{project?.name ?? "Sin proyecto"}</span></span>; }

function StatusValue({ status }: { status: TlozMissionStatus }) {
  const color = missionStatusTone[status];
  return <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color }}><span className="size-[7px] rounded-full bg-current" aria-hidden="true" />{missionStatusLabel[status]}</span>;
}
