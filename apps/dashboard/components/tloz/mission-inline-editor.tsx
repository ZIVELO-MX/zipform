"use client";

import { useEffect, useState, useTransition } from "react";
import { DatePicker, displayUsername, EntityPicker, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, toast, useOverlayToasterId, UserAvatarLabel, UserPicker } from "@zipform/ui";
import type { TlozMissionUpdateInput } from "@zipform/data";
import type { TlozMissionRecord } from "../../lib/tloz-data";
import type { TlozMissionStatus, TlozMissionType } from "@zipform/types";
import { createProject, patchMissionStatus, updateMission } from "../../app/tloz/actions";
import { formatDate, missionStatusLabel, missionStatusTone, missionTypeLabel, missionTypeTone } from "./tloz-utils";
import { DetailPropertyRow } from "./detail-property-row";

export type MissionEditorOptions = {
  projects: Array<{ id: string; name: string; description?: string; color?: string }>;
  seasons?: Array<{ id: string; name: string; description?: string }>;
  episodes: Array<{ id: string; name: string; seasonId: string; description?: string }>;
  users: Array<{ id: string; name: string; username?: string; avatarUrl?: string }>;
  missions?: Array<{ id: string; projectId?: string; seasonId?: string }>;
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

  return <div className="flex flex-col" aria-busy={isPending}>
    <DetailPropertyRow label="Estado" display={<StatusValue status={current.status} />}>
      <Select value={current.status} onValueChange={(value) => changeStatus(value as TlozMissionStatus)}><SelectTrigger aria-label="Estado"><SelectValue><StatusValue status={current.status} /></SelectValue></SelectTrigger><SelectContent position="item-aligned"><SelectGroup>{statuses.map((value) => <SelectItem key={value} value={value}><StatusValue status={value} /></SelectItem>)}</SelectGroup></SelectContent></Select>
    </DetailPropertyRow>
    <DetailPropertyRow label="Categoría" display={(() => { const tone = missionTypeTone[current.type]; return <span className="inline-flex rounded-full px-[9px] py-[3px] text-xs font-bold" style={{ background: tone === "#d72228" ? "#FDECEC" : tone === "#2d6cdf" ? "#EEF2FF" : tone === "#1e8e5a" ? "#E6F4EA" : "#F2EAFE", color: tone }}>{missionTypeLabel[current.type]}</span>; })()}>
      <Select value={current.type} onValueChange={(value) => persist({ type: value as TlozMissionType }, "Tipo actualizado")}><SelectTrigger aria-label="Tipo"><SelectValue /></SelectTrigger><SelectContent position="item-aligned"><SelectGroup>{missionTypes.map((value) => <SelectItem key={value} value={value}>{missionTypeLabel[value]}</SelectItem>)}</SelectGroup></SelectContent></Select>
    </DetailPropertyRow>
    {options?.users.length ? <DetailPropertyRow label="Responsable" display={<UserAvatarLabel name={current.owner.name} label={current.owner.username ? displayUsername(current.owner.username) : current.owner.name} labelOnly imageUrl={current.owner.avatarUrl} size="sm" />}>
      <UserPicker users={options.users} value={current.ownerId} label="Responsable" onValueChange={(value) => persist({ ownerId: value }, "Responsable actualizado")} />
    </DetailPropertyRow> : null}
    <DetailPropertyRow label="Proyecto" display={<span className="inline-flex min-w-0 items-center gap-1.5"><span className="size-[7px] shrink-0 rounded-full" style={{ backgroundColor: current.project?.color ?? "#9a9a98" }} /><span className="truncate">{current.project?.name ?? "Sin proyecto"}</span></span>}>
      <EntityPicker label="Proyecto" options={projects.map((project) => ({ ...project, color: project.color }))} value={current.projectId} onValueChange={(value) => persist({ projectId: value, seasonId: "", episodeId: "" }, "Proyecto actualizado")} onCreate={async (name) => { const project = await createProject(name); setProjects((items) => [...items, project]); return project; }} />
    </DetailPropertyRow>
    <DetailPropertyRow label="Inicio" display={<span className="font-mono text-[12.5px] font-semibold">{formatDate(current.startDate)}</span>}>
      <DatePicker value={current.startDate} label="Fecha de inicio" onValueChange={(value) => persist({ startDate: value ?? "" }, "Fecha actualizada")} />
    </DetailPropertyRow>
    <DetailPropertyRow label="Vence" display={<span className="font-mono text-[12.5px] font-semibold text-[#B91C22]">{formatDate(current.dueDate)}</span>}>
      <DatePicker value={current.dueDate} label="Fecha límite" onValueChange={(value) => persist({ dueDate: value ?? "" }, "Fecha actualizada")} />
    </DetailPropertyRow>
  </div>;
}

function StatusValue({ status }: { status: TlozMissionStatus }) {
  const color = missionStatusTone[status];
  return <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color }}><span className="size-[7px] rounded-full bg-current" aria-hidden="true" />{missionStatusLabel[status]}</span>;
}
