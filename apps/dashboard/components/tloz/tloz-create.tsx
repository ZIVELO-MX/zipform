"use client";

import { createContext, useContext, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { Plus } from "lucide-react";
import { Button, ColorPicker, DatePicker, EntityPicker, IconPicker, Input, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, SlideOver, toast, useOverlayToasterId, UserPicker, type IconPickerOption } from "@zipform/ui";
import type { TlozInventoryCategory, TlozMissionStatus, TlozMissionType, TlozProject, TlozQuestItem, UserProfile } from "@zipform/types";
import type { TlozMissionRecord } from "../../lib/tloz-data";
import { TlozValidationError, validateMissionCreate, validateProjectCreate, validateQuestItemCreate, type TlozResourceInput } from "@zipform/data";
import { createMission, createProject, createQuestItem } from "../../app/tloz/actions";
import { resolveMissionIcon } from "./tloz-utils";
import { initialDraft } from "./tloz-create-defaults";

export type TlozCreateKind = "mission" | "project" | "inventory";
type CreateContextValue = { kind: TlozCreateKind; label: string; openCreate: () => void };
const CreateContext = createContext<CreateContextValue | null>(null);
const kindLabel = { mission: "Mission", project: "Project", inventory: "Inventory item" } as const;
const icons: IconPickerOption[] = ["Sword", "Sparkles", "Target", "Search", "Database", "FileText", "FileCheck", "KeyRound", "Shield", "Wrench", "FolderKanban", "PackageOpen"].map((id) => ({ id, label: id, icon: resolveMissionIcon(id) }));

export function TlozCreateProvider({ children, kind, projects, users, missions = [], questItems = [], fixedProjectId }: { children: React.ReactNode; kind: TlozCreateKind; projects: TlozProject[]; users: UserProfile[]; missions?: TlozMissionRecord[]; questItems?: TlozQuestItem[]; fixedProjectId?: string }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({
    kind,
    label: kindLabel[kind],
    openCreate: () => {
      if (isMobile) {
        router.push(`/tloz/new?kind=${kind}`);
      } else {
        setOpen(true);
      }
    },
  }), [isMobile, kind, router]);
  return <CreateContext.Provider value={value}>{children}<CreateEntitySlideOver open={open} onOpenChange={setOpen} kind={kind} projects={projects} users={users} missions={missions} questItems={questItems} fixedProjectId={fixedProjectId} /></CreateContext.Provider>;
}

export function useTlozCreate() {
  const context = useContext(CreateContext);
  if (!context) throw new Error("useTlozCreate must be used inside TlozCreateProvider");
  return context;
}

export function CreateNewEntityButton({ variant = "row" }: { variant?: "row" | "control" }) {
  const { label, openCreate } = useTlozCreate();
  return variant === "control"
    ? <Button type="button" className="w-full justify-center bg-zivelo text-white hover:bg-zivelo/90" onClick={openCreate}><Plus />Crear nuevo {label}</Button>
    : <button type="button" className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-carbon/15 bg-white/60 text-[13px] font-semibold text-carbon/55 transition-colors hover:border-zivelo/30 hover:text-zivelo" onClick={openCreate}><Plus className="size-3.5" />Crear nuevo {label}</button>;
}

export function CreateForm({ kind, projects, users, missions = [], questItems = [], fixedProjectId, onDone }: { kind: TlozCreateKind; projects: TlozProject[]; users: UserProfile[]; missions?: TlozMissionRecord[]; questItems?: TlozQuestItem[]; fixedProjectId?: string; onDone?: () => void }) {
  const router = useRouter();
  const toasterId = useOverlayToasterId();
  const [pending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);
  const defaultOwnerId = users.find((user) => user.username === "zibot")?.id ?? users[0]?.id ?? "";
  const defaultProjectId = fixedProjectId ?? projects.find((project) => project.slug === "zivelo")?.id ?? projects[0]?.id ?? "";
  const [draft, setDraft] = useState<Record<string, string>>(() => initialDraft(kind, defaultOwnerId, defaultProjectId, today));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resources, setResources] = useState<TlozResourceInput[]>([]);
  const formId = `create-${kind}-form`;
  function field(name: string, value: string) { setDraft((current) => ({ ...current, [name]: value })); setErrors((current) => ({ ...current, [name]: "" })); }
  function reset() { setDraft(initialDraft(kind, defaultOwnerId, defaultProjectId, today)); setErrors({}); }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const input = buildInput(kind, draft, resources);
      if (kind === "mission") validateMissionCreate(input as never);
      else if (kind === "project") validateProjectCreate(input as never);
      else validateQuestItemCreate(input as never);
      startTransition(async () => {
        const toastId = toast.loading(`Creando ${kindLabel[kind]}…`, { toasterId });
        try {
          if (kind === "mission") await createMission(input as never);
          else if (kind === "project") await createProject(input as never);
          else await createQuestItem(input as never);
          toast.success(`${kindLabel[kind]} creado`, { id: toastId, toasterId }); reset(); onDone?.(); router.refresh();
        } catch { toast.error("No se pudo crear. Revisa los datos e intenta de nuevo.", { id: toastId, toasterId }); }
      });
    } catch (error) { if (error instanceof TlozValidationError) setErrors(error.fields); else throw error; }
  }
  return (
    <form id={formId} onSubmit={submit} className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6" noValidate>
      <div><h3 className="mb-1 text-xl font-bold text-carbon">Nuevo {kindLabel[kind]}</h3><p className="m-0 text-sm text-carbon/55">Completa los datos requeridos antes de guardar.</p></div>
      <FormField label={kind === "mission" ? "Título" : "Nombre"} error={errors[kind === "mission" ? "title" : "name"]} required><Input autoFocus value={draft.name} maxLength={160} onChange={(event) => field("name", event.target.value)} /></FormField>
      <FormField label={kind === "mission" ? "Descripción" : "Descripción"} error={errors.description}><textarea className="min-h-24 w-full rounded-xl border border-carbon/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-zivelo/50 focus:ring-2 focus:ring-zivelo/10" value={draft.description} rows={4} maxLength={kind === "mission" ? 280 : 5000} onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => field("description", event.target.value)} /></FormField>
      {kind === "mission" ? <FormField label="Detalle" error={errors.descriptionDetail}><textarea className="min-h-40 w-full rounded-xl border border-carbon/15 bg-white px-3 py-2 font-mono text-[13px] leading-[1.6] outline-none transition focus:border-zivelo/50 focus:ring-2 focus:ring-zivelo/10" value={draft.descriptionDetail} rows={8} maxLength={20000} placeholder="Markdown, incluyendo - [ ] tasks…" onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => field("descriptionDetail", event.target.value)} /></FormField> : null}
      <div className="grid gap-4 sm:grid-cols-2"><FormField label="Icono" error={errors.icon} required><IconPicker icons={icons} value={draft.icon} onValueChange={(icon) => field("icon", icon)} /></FormField>
        {kind === "mission" ? <FormField label="Categoría"><Select value={draft.type} onValueChange={(value) => field("type", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="main_quest">Main Quest</SelectItem><SelectItem value="side_quest">Side Quest</SelectItem><SelectItem value="farming_quest">Farming Quest</SelectItem><SelectItem value="exploration_quest">Research</SelectItem></SelectGroup></SelectContent></Select></FormField> : kind === "inventory" ? <FormField label="Categoría"><Select value={draft.category} onValueChange={(value) => field("category", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{[["tool","Herramienta"],["access","Acceso"],["asset","Activo"],["document","Documento"],["other","Otro"]].map(([id,label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectGroup></SelectContent></Select></FormField> : <FormField label="Color" error={errors.color}><ColorPicker value={draft.color} onValueChange={(color) => field("color", color)} /></FormField>}
      </div>
      {kind === "mission" ? <FormField label="Proyecto" error={errors.projectId} required>{fixedProjectId ? <div className="rounded-xl border border-carbon/10 bg-carbon/[0.03] px-3 py-2 text-sm font-semibold">{projects.find((project) => project.id === fixedProjectId)?.name}</div> : <EntityPicker label="Proyecto" options={projects.map((project) => ({ id: project.id, name: project.name, color: project.color }))} value={draft.projectId} allowEmpty={false} onValueChange={(projectId) => field("projectId", projectId)} />}</FormField> : null}
      <FormField label="Responsable" error={errors.ownerId} required={kind !== "inventory"}><UserPicker users={users} value={draft.ownerId || undefined} allowEmpty={kind === "inventory"} onValueChange={(ownerId) => field("ownerId", ownerId)} /></FormField>
      {kind === "mission" ? <MissionRelations draft={draft} field={field} missions={missions} questItems={questItems} resources={resources} setResources={setResources} /> : null}
      {kind !== "inventory" ? <div className="grid gap-4 sm:grid-cols-2"><FormField label="Inicio" error={errors.startDate} required={kind === "project"}><DatePicker value={draft.startDate || undefined} label="Fecha de inicio" clearable={kind !== "project"} onValueChange={(value) => field("startDate", value ?? "")} /></FormField><FormField label="Vence" error={errors.dueDate}><DatePicker value={draft.dueDate || undefined} label="Fecha límite" onValueChange={(value) => field("dueDate", value ?? "")} /></FormField></div> : null}
    </form>
  );
}

function CreateEntitySlideOver({ open, onOpenChange, kind, projects, users, missions, questItems, fixedProjectId }: { open: boolean; onOpenChange: (open: boolean) => void; kind: TlozCreateKind; projects: TlozProject[]; users: UserProfile[]; missions: TlozMissionRecord[]; questItems: TlozQuestItem[]; fixedProjectId?: string }) {
  return <SlideOver open={open} title={`Crear ${kindLabel[kind]}`} onOpenChange={onOpenChange} footer={<><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" form={`create-${kind}-form`}>Guardar</Button></>}>
    <CreateForm key={String(open)} kind={kind} projects={projects} users={users} missions={missions} questItems={questItems} fixedProjectId={fixedProjectId} onDone={() => onOpenChange(false)} />
  </SlideOver>;
}

function FormField({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) { return <label className="flex flex-col gap-1.5"><span className="text-xs font-bold text-carbon/60">{label}{required ? <span className="text-zivelo"> *</span> : null}</span>{children}{error ? <span className="text-xs font-medium text-[#B91C22]">{error}</span> : null}</label>; }
function buildInput(kind: TlozCreateKind, draft: Record<string, string>, resources: TlozResourceInput[] = []) {
  if (kind === "mission") return { title: draft.name, description: draft.description, descriptionDetail: draft.descriptionDetail, icon: draft.icon, type: draft.type as TlozMissionType, status: draft.status as TlozMissionStatus, ownerId: draft.ownerId, projectId: draft.projectId, startDate: draft.startDate || undefined, dueDate: draft.dueDate || undefined, progress: 0, dependencyIds: splitIds(draft.dependencyIds), requiredQuestItemIds: splitIds(draft.requiredQuestItemIds), resources };
  if (kind === "project") return { name: draft.name, description: draft.description, icon: draft.icon, color: draft.color, status: "active" as const, type: "normal" as const, ownerId: draft.ownerId, startDate: draft.startDate, dueDate: draft.dueDate || undefined };
  return { name: draft.name, description: draft.description, icon: draft.icon, status: "locked" as const, category: draft.category as TlozInventoryCategory, ownerId: draft.ownerId || undefined };
}

function splitIds(value?: string) { return value ? value.split(",").filter(Boolean) : []; }

function MissionRelations({ draft, field, missions, questItems, resources, setResources }: { draft: Record<string, string>; field: (name: string, value: string) => void; missions: TlozMissionRecord[]; questItems: TlozQuestItem[]; resources: TlozResourceInput[]; setResources: React.Dispatch<React.SetStateAction<TlozResourceInput[]>> }) {
  const toggle = (name: string, id: string) => { const ids = new Set(splitIds(draft[name])); ids.has(id) ? ids.delete(id) : ids.add(id); field(name, [...ids].join(",")); };
  return <section className="space-y-4 rounded-xl border border-carbon/10 bg-carbon/[0.025] p-4"><h4 className="m-0 text-sm font-bold">Relaciones y recursos</h4><div><p className="mb-2 text-xs font-bold text-carbon/60">Dependencias</p><div className="grid gap-1 sm:grid-cols-2">{missions.filter((m) => m.id !== draft.id).map((m) => <label key={m.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={splitIds(draft.dependencyIds).includes(m.id)} onChange={() => toggle("dependencyIds", m.id)} />{m.displayId} · {m.title}</label>)}</div></div><div><p className="mb-2 text-xs font-bold text-carbon/60">Quest Items requeridos</p><div className="grid gap-1 sm:grid-cols-2">{questItems.map((item) => <label key={item.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={splitIds(draft.requiredQuestItemIds).includes(item.id)} onChange={() => toggle("requiredQuestItemIds", item.id)} />{item.name}</label>)}</div></div><div><div className="mb-2 flex items-center justify-between"><p className="m-0 text-xs font-bold text-carbon/60">Resources</p><Button type="button" variant="outline" size="sm" onClick={() => setResources((items) => [...items, { type: "link", title: "" }])}>Agregar recurso</Button></div>{resources.map((resource, index) => <div key={index} className="grid gap-2 sm:grid-cols-[130px_1fr_1fr_auto]"><Select value={resource.type} onValueChange={(type) => setResources((items) => items.map((item, i) => i === index ? { ...item, type: type as TlozResourceInput["type"] } : item))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{["link","document","file","image","note"].map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectGroup></SelectContent></Select><Input placeholder="Título" value={resource.title} onChange={(e) => setResources((items) => items.map((item, i) => i === index ? { ...item, title: e.target.value } : item))} /><Input placeholder="URL o ID" value={resource.url ?? resource.fileId ?? ""} onChange={(e) => setResources((items) => items.map((item, i) => i === index ? { ...item, url: e.target.value, fileId: undefined } : item))} /><Button type="button" variant="ghost" onClick={() => setResources((items) => items.filter((_, i) => i !== index))}>Eliminar</Button></div>)}</div></section>;
}
