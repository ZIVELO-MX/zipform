"use client";

import { useEffect, useState, useTransition } from "react";
import { DatePicker, EntityPicker, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, toast, UserAvatarLabel, UserPicker } from "@zipform/ui";
import type { TlozMissionUpdateInput } from "@zipform/data";
import type { TlozMissionRecord } from "../../lib/tloz-data";
import type { TlozMissionStatus, TlozMissionType } from "@zipform/types";
import { createProject, patchMissionStatus, updateMission } from "../../app/tloz/actions";
import { formatDate, missionStatusLabel, missionTypeLabel } from "./tloz-utils";

export type MissionEditorOptions = {
  projects: Array<{ id: string; name: string; description?: string; color?: string }>;
  seasons?: Array<{ id: string; name: string; description?: string }>;
  episodes: Array<{ id: string; name: string; seasonId: string; description?: string }>;
  users: Array<{ id: string; name: string; username?: string; avatarUrl?: string }>;
  missions?: Array<{ id: string; projectId?: string; seasonId?: string }>;
};

type EditableField = "status" | "type" | "startDate" | "dueDate" | "project" | "owner";

const statuses: TlozMissionStatus[] = ["now", "next", "later", "blocked", "completed"];
const missionTypes: TlozMissionType[] = ["main_quest", "side_quest", "farming_quest", "exploration_quest"];

export function MissionInlineEditor({ mission, options, onMissionChange }: { mission: TlozMissionRecord; options?: MissionEditorOptions; onMissionChange?: (mission: TlozMissionRecord) => void }) {
  const [current, setCurrent] = useState(mission);
  const [activeField, setActiveField] = useState<EditableField | null>(null);
  const [projects, setProjects] = useState(options?.projects ?? []);
  const [isPending, startTransition] = useTransition();

  useEffect(() => setCurrent(mission), [mission]);
  useEffect(() => { setProjects(options?.projects ?? []); }, [options]);

  function apply(updated: TlozMissionRecord) { setCurrent(updated); onMissionChange?.(updated); }
  function persist(input: TlozMissionUpdateInput, success: string) {
    setActiveField(null);
    const toastId = toast.loading("Guardando cambios…");
    startTransition(async () => {
      try { apply(await updateMission(current.id, input)); toast.success(success, { id: toastId }); }
      catch { toast.error("No se pudieron guardar los cambios", { id: toastId }); }
    });
  }
  function changeStatus(value: TlozMissionStatus) {
    setActiveField(null);
    const toastId = toast.loading("Actualizando estado…");
    startTransition(async () => {
      try { apply(await patchMissionStatus(current.id, value)); toast.success("Estado actualizado", { id: toastId }); }
      catch { toast.error("No se pudo actualizar el estado", { id: toastId }); }
    });
  }

  return <div className="flex flex-col" aria-busy={isPending}>
    <PropertyRow field="status" label="Estado" display={<StatusValue status={current.status} />} activeField={activeField} setActiveField={setActiveField}>
      <Select value={current.status} onValueChange={(value) => changeStatus(value as TlozMissionStatus)}><SelectTrigger aria-label="Estado"><SelectValue /></SelectTrigger><SelectContent position="item-aligned"><SelectGroup>{statuses.map((value) => <SelectItem key={value} value={value}>{missionStatusLabel[value]}</SelectItem>)}</SelectGroup></SelectContent></Select>
    </PropertyRow>
    <PropertyRow field="type" label="Categoría" display={<span className="inline-flex rounded-full bg-[#FDECEC] px-[9px] py-[3px] text-xs font-bold text-[#B91C22]">{missionTypeLabel[current.type]}</span>} activeField={activeField} setActiveField={setActiveField}>
      <Select value={current.type} onValueChange={(value) => persist({ type: value as TlozMissionType }, "Tipo actualizado")}><SelectTrigger aria-label="Tipo"><SelectValue /></SelectTrigger><SelectContent position="item-aligned"><SelectGroup>{missionTypes.map((value) => <SelectItem key={value} value={value}>{missionTypeLabel[value]}</SelectItem>)}</SelectGroup></SelectContent></Select>
    </PropertyRow>
    {options?.users.length ? <PropertyRow field="owner" label="Responsable" display={<UserAvatarLabel name={current.owner.name} label={current.owner.username ?? current.owner.name} labelOnly imageUrl={current.owner.avatarUrl} size="sm" />} activeField={activeField} setActiveField={setActiveField}>
      <UserPicker users={options.users} value={current.ownerId} label="Responsable" onValueChange={(value) => persist({ ownerId: value }, "Responsable actualizado")} />
    </PropertyRow> : null}
    <PropertyRow field="project" label="Proyecto" display={<span className="inline-flex min-w-0 items-center gap-1.5"><span className="size-[7px] shrink-0 rounded-full" style={{ backgroundColor: current.project?.color ?? "#9a9a98" }} /><span className="truncate">{current.project?.name ?? "Sin proyecto"}</span></span>} activeField={activeField} setActiveField={setActiveField}>
      <EntityPicker label="Proyecto" options={projects.map((project) => ({ ...project, color: project.color }))} value={current.projectId} onValueChange={(value) => persist({ projectId: value, seasonId: "", episodeId: "" }, "Proyecto actualizado")} onCreate={async (name) => { const project = await createProject(name); setProjects((items) => [...items, project]); return project; }} />
    </PropertyRow>
    <PropertyRow field="startDate" label="Inicio" display={<span className="font-mono text-[12.5px] font-semibold">{formatDate(current.startDate)}</span>} activeField={activeField} setActiveField={setActiveField}>
      <DatePicker value={current.startDate} label="Fecha de inicio" onValueChange={(value) => persist({ startDate: value ?? "" }, "Fecha actualizada")} />
    </PropertyRow>
    <PropertyRow field="dueDate" label="Vence" display={<span className="font-mono text-[12.5px] font-semibold text-[#B91C22]">{formatDate(current.dueDate)}</span>} activeField={activeField} setActiveField={setActiveField}>
      <DatePicker value={current.dueDate} label="Fecha límite" onValueChange={(value) => persist({ dueDate: value ?? "" }, "Fecha actualizada")} />
    </PropertyRow>
  </div>;
}

function PropertyRow({ field, label, display, activeField, setActiveField, children }: { field: EditableField; label: string; display: React.ReactNode; activeField: EditableField | null; setActiveField: (field: EditableField | null) => void; children: React.ReactNode }) {
  if (activeField === field) return <div className="rounded-lg bg-[#F7F7F5] px-2 py-2"><label className="mb-1.5 block text-xs font-medium text-[#9A9A98]">{label}</label>{children}</div>;
  return <button type="button" className="grid min-h-10 w-full grid-cols-[88px_minmax(0,1fr)] items-center gap-2.5 rounded-lg px-2 text-left transition-colors hover:bg-[#F7F7F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1D1D1B]/20" onClick={() => setActiveField(field)}><span className="text-xs font-medium text-[#9A9A98]">{label}</span><span className="min-w-0 truncate text-[12.5px] font-semibold text-[#1D1D1B]">{display}</span></button>;
}

function StatusValue({ status }: { status: TlozMissionStatus }) {
  const color = status === "now" ? "#1E8E5A" : status === "next" ? "#2D6CDF" : status === "later" ? "#7A4ED9" : status === "blocked" ? "#B91C22" : "#6B6B6B";
  return <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color }}><span className="size-[7px] rounded-full bg-current" aria-hidden="true" />{missionStatusLabel[status]}</span>;
}
