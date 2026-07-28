"use client";

import { useEffect, useState, useTransition } from "react";
import { DatePicker, EntityPicker, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, toast, useOverlayToasterId, UserAvatarLabel, UserPicker } from "@tloz/ui";
import type { TlozMissionUpdateInput } from "@tloz/data";
import type { TlozMissionRecord } from "../../lib/tloz-data";
import type { TlozDocument, TlozFieldDefinition, TlozMissionStatus, TlozMissionType } from "@tloz/types";
import { patchMissionStatus, updateMission } from "../../app/tloz/actions";
import { formatDate, missionStatusLabel, missionStatusTone, missionTypeLabel, missionTypeTone, resolveMissionIcon } from "./tloz-utils";
import { DetailPropertyRow } from "./detail-property-row";

export type MissionEditorOptions = {
  projects: Array<{ id: string; name: string; description?: string; color?: string; icon?: string }>;
  users: Array<{ id: string; name: string; username?: string; avatarUrl?: string }>;
  missions?: Array<{ id: string; projectId?: string }>;
  document?: TlozDocument;
  contract?: TlozFieldDefinition[];
  hideEmptyFields?: boolean;
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

  return <MissionPropertyFields values={current} options={options} onChange={(field, value) => field === "status" ? changeStatus(value as TlozMissionStatus) : persist({ [field]: value }, `${field === "type" ? "Tipo" : field === "ownerId" ? "Responsable" : field === "projectId" ? "Proyecto" : "Fecha"} actualizado`)} ariaBusy={isPending} />;
}

export function MissionPropertyFields({ values, options, onChange, ariaBusy = false, layout = "stacked" }: { values: MissionPropertyValues & { owner?: { name: string; username?: string; avatarUrl?: string }; project?: { name: string; color?: string; icon?: string } }; options?: MissionEditorOptions; onChange: (field: keyof MissionPropertyValues, value: string) => void; ariaBusy?: boolean; layout?: "stacked" | "grid" }) {
  const projects = options?.projects ?? [];
  const statusOptions = contractOptions(options?.contract, "status", statuses.map((value) => ({ value, label: missionStatusLabel[value], color: missionStatusTone[value] })));
  const categoryOptions = contractOptions(options?.contract, "category", missionTypes.map((value) => ({ value, label: missionTypeLabel[value], color: missionTypeTone[value] })));
  const selectedOwner = options?.users.find((user) => user.id === values.ownerId);
  const selectedProject = projects.find((project) => project.id === values.projectId);
  const status = values.status;
  return <div className={layout === "grid" ? "grid grid-cols-1 gap-1 sm:grid-cols-2" : "flex flex-col"} data-layout={layout} aria-busy={ariaBusy}>
    <DetailPropertyRow label="Estado" display={<OptionValue value={status} options={statusOptions} status />}><Select value={status} onValueChange={(value) => onChange("status", value)}><SelectTrigger aria-label="Estado"><SelectValue><OptionValue value={status} options={statusOptions} status /></SelectValue></SelectTrigger><SelectContent position="item-aligned"><SelectGroup>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}><OptionValue value={option.value} options={statusOptions} status /></SelectItem>)}</SelectGroup></SelectContent></Select></DetailPropertyRow>
    <DetailPropertyRow label="Categoría" display={<OptionValue value={values.type} options={categoryOptions} />}><Select value={values.type} onValueChange={(value) => onChange("type", value)}><SelectTrigger aria-label="Tipo"><SelectValue><OptionValue value={values.type} options={categoryOptions} /></SelectValue></SelectTrigger><SelectContent position="item-aligned"><SelectGroup>{categoryOptions.map((option) => <SelectItem key={option.value} value={option.value}><OptionValue value={option.value} options={categoryOptions} /></SelectItem>)}</SelectGroup></SelectContent></Select></DetailPropertyRow>
    {options?.users.length && (!options.hideEmptyFields || values.ownerId) ? <DetailPropertyRow label="Responsable" display={<UserAvatarLabel name={values.owner?.name ?? selectedOwner?.name ?? "Sin responsable"} label={values.owner?.username ?? selectedOwner?.username ?? "Sin responsable"} labelOnly imageUrl={values.owner?.avatarUrl ?? selectedOwner?.avatarUrl} size="sm" />}><UserPicker users={options.users} value={values.ownerId} label="Responsable" onValueChange={(value) => onChange("ownerId", value)} /></DetailPropertyRow> : null}
    {(!options?.hideEmptyFields || values.projectId) ? <DetailPropertyRow label="Proyecto" display={<ProjectValue project={values.project ?? selectedProject} />}><EntityPicker label="Proyecto" options={projects.map((project) => ({ ...project, iconComponent: resolveMissionIcon(project.icon), color: project.color }))} value={values.projectId} onValueChange={(value) => onChange("projectId", value)} /></DetailPropertyRow> : null}
    {(!options?.hideEmptyFields || values.startDate) ? <DetailPropertyRow label="Inicio" display={<span className="font-mono text-[12.5px] font-semibold">{formatDate(values.startDate)}</span>}><DatePicker value={values.startDate} label="Fecha de inicio" onValueChange={(value) => onChange("startDate", value ?? "")} /></DetailPropertyRow> : null}
    {(!options?.hideEmptyFields || values.dueDate) ? <DetailPropertyRow label="Vence" display={<span className="font-mono text-[12.5px] font-semibold text-[#B91C22]">{formatDate(values.dueDate)}</span>}><DatePicker value={values.dueDate} label="Fecha límite" onValueChange={(value) => onChange("dueDate", value ?? "")} /></DetailPropertyRow> : null}
  </div>;
}

function ProjectValue({ project }: { project?: { name: string; color?: string; icon?: string } }) { const color = project?.color ?? "#6B6B6B"; const Icon = resolveMissionIcon(project?.icon); return <span className="inline-flex min-w-0 items-center gap-1.5"><span className="grid size-6 shrink-0 place-items-center rounded-md [&_svg]:size-3.5" style={{ backgroundColor: `${color}18`, color }}><Icon aria-hidden="true" /></span><span className="truncate">{project?.name ?? "Sin proyecto"}</span></span>; }

type ContractOption = { value: string; label: string; color?: string };

function contractOptions(contract: TlozFieldDefinition[] | undefined, key: string, fallback: ContractOption[]) {
  const options = contract?.find((field) => field.key === key)?.options;
  return options?.length ? options : fallback;
}

function OptionValue({ value, options, status = false }: { value: string; options: ContractOption[]; status?: boolean }) {
  const option = options.find((candidate) => candidate.value === value);
  const color = option?.color ?? "#6B6B6B";
  if (status) return <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color }}><span className="size-[7px] rounded-full bg-current" aria-hidden="true" />{option?.label ?? value}</span>;
  return <span className="inline-flex rounded-full px-[9px] py-[3px] text-xs font-bold" style={{ background: `${color}18`, color }}>{option?.label ?? value}</span>;
}
