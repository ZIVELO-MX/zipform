"use client";

import { cloneElement, createContext, isValidElement, useContext, useId, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { Plus } from "lucide-react";
import { Button, ColorPicker, DatePicker, EntityPicker, IconPicker, Input, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, SlideOver, toast, useOverlayToasterId, UserPicker, type IconPickerOption } from "@tloz/ui";
import type { ContainerRecord, TlozDocumentScalar, TlozFieldDefinition, TlozProject, TlozQuestItem, UserProfile } from "@tloz/types";
import type { TlozMissionRecord } from "../../lib/tloz-data";
import { TlozValidationError, validateMissionCreate, validateProjectCreate, validateQuestItemCreate, type TlozResourceInput } from "@tloz/data";
import { createMission, createProject, createQuestItem } from "../../app/tloz/actions";
import { resolveMissionIcon } from "./tloz-utils";
import { TLOZ_ICON_OPTIONS } from "./tloz-icon-catalog";
import { buildCreateInput, documentPropertyDefaults, splitCreateIds } from "./tloz-create-input";
import { initialDraft } from "./tloz-create-defaults";
import { AddDependency, AddResource } from "./mission-detail";
import { MissionPropertyFields, type MissionPropertyValues } from "./mission-inline-editor";
import { CreateDocumentPropertyInputs } from "./document-property-fields";
import { useTlozCapabilities } from "./tloz-capabilities";
import { tlozErrorMessage } from "../../lib/tloz-error";

export type TlozCreateKind = "mission" | "project" | "inventory" | "workshop" | "library";
type CreateContextValue = { kind: TlozCreateKind; label: string; openCreate: () => void };
const CreateContext = createContext<CreateContextValue | null>(null);
const kindLabel = { mission: "Mission", project: "Project", inventory: "Inventory item", workshop: "Workshop", library: "Library" } as const;
const icons: IconPickerOption[] = TLOZ_ICON_OPTIONS;

export function TlozCreateProvider({ children, kind, projects, users, missions = [], questItems = [], projectContracts = {}, fixedProjectId, canonicalContainer }: { children: React.ReactNode; kind: TlozCreateKind; projects: TlozProject[]; users: UserProfile[]; missions?: TlozMissionRecord[]; questItems?: TlozQuestItem[]; projectContracts?: Record<string, TlozFieldDefinition[]>; fixedProjectId?: string; canonicalContainer?: ContainerRecord }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({
    kind,
    label: kindLabel[kind],
    openCreate: () => {
      if (isMobile) {
        router.push(`/new?${new URLSearchParams({ kind, ...(fixedProjectId ? { projectId: fixedProjectId } : {}) })}`);
      } else {
        setOpen(true);
      }
    },
  }), [fixedProjectId, isMobile, kind, router]);
  return <CreateContext.Provider value={value}>{children}<CreateEntitySlideOver open={open} onOpenChange={setOpen} kind={kind} projects={projects} users={users} missions={missions} questItems={questItems} projectContracts={projectContracts} fixedProjectId={fixedProjectId} canonicalContainer={canonicalContainer} /></CreateContext.Provider>;
}

export function useTlozCreate() {
  const context = useContext(CreateContext);
  if (!context) throw new Error("useTlozCreate must be used inside TlozCreateProvider");
  return context;
}

export function CreateNewEntityButton({ variant = "row" }: { variant?: "row" | "control" }) {
  const capabilities = useTlozCapabilities();
  const { label, openCreate } = useTlozCreate();
  if (!capabilities.canCreate) return null;
  return variant === "control"
    ? <Button type="button" className="w-full justify-center bg-zivelo text-white hover:bg-zivelo/90" onClick={openCreate}><Plus />Crear nuevo {label}</Button>
    : <button type="button" className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-carbon/15 bg-white/60 text-[13px] font-semibold text-carbon/55 transition-colors hover:border-zivelo/30 hover:text-zivelo" onClick={openCreate}><Plus className="size-3.5" />Crear nuevo {label}</button>;
}

export function CreateForm({ kind, projects, users, missions = [], questItems = [], projectContracts = {}, fixedProjectId, canonicalContainer, onDone, showActions = true, onPendingChange }: { kind: TlozCreateKind; projects: TlozProject[]; users: UserProfile[]; missions?: TlozMissionRecord[]; questItems?: TlozQuestItem[]; projectContracts?: Record<string, TlozFieldDefinition[]>; fixedProjectId?: string; canonicalContainer?: ContainerRecord; onDone?: () => void; showActions?: boolean; onPendingChange?: (pending: boolean) => void }) {
  const router = useRouter();
  const toasterId = useOverlayToasterId();
  const [pending, startTransition] = useTransition();
  const submitting = useRef(false);
  const today = new Date().toISOString().slice(0, 10);
  const defaultOwnerId = users.find((user) => user.username === "zibot")?.id ?? users[0]?.id ?? "";
  const defaultProjectId = fixedProjectId ?? projects.find((project) => project.slug === "zivelo")?.id ?? projects[0]?.id ?? "";
  function freshDraft() {
    const next = initialDraft(kind, defaultOwnerId, defaultProjectId, today);
    if (kind !== "mission") return next;
    const contract = projectContracts[defaultProjectId] ?? [];
    const status = contract.find((item) => item.key === "status")?.defaultValue;
    const category = contract.find((item) => item.key === "category")?.defaultValue;
    return {
      ...next,
      ...(typeof status === "string" ? { status } : {}),
      ...(typeof category === "string" ? { type: category } : {}),
    };
  }
  const [draft, setDraft] = useState<Record<string, string>>(freshDraft);
  const [documentProperties, setDocumentProperties] = useState<Record<string, TlozDocumentScalar>>(
    () => documentPropertyDefaults(projectContracts[defaultProjectId] ?? []),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resources, setResources] = useState<TlozResourceInput[]>([]);
  const missionContract = projectContracts[draft.projectId] ?? [];
  const formId = `create-${kind}-form`;
  function field(name: string, value: string) {
    if (submitting.current) return;
    setDraft((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "", ...(name === "name" ? { title: "" } : {}) }));
  }
  function missionField(name: string, value: string) {
    if (submitting.current) return;
    if (name !== "projectId") {
      field(name, value);
      return;
    }
    const nextContract = projectContracts[value] ?? [];
    const status = nextContract.find((item) => item.key === "status")?.defaultValue;
    const category = nextContract.find((item) => item.key === "category")?.defaultValue;
    setDraft((current) => ({
      ...current,
      projectId: value,
      ...(typeof status === "string" ? { status } : {}),
      ...(typeof category === "string" ? { type: category } : {}),
    }));
    setDocumentProperties(documentPropertyDefaults(nextContract));
    setErrors((current) => ({ ...current, projectId: "" }));
  }
  function reset() {
    setDraft(freshDraft());
    setDocumentProperties(documentPropertyDefaults(projectContracts[defaultProjectId] ?? []));
    setErrors({});
    setResources([]);
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    setErrors({});
    try {
      const input = buildCreateInput(kind, draft, resources);
      if (kind === "mission") validateMissionCreate(input as never);
      else if (kind === "project") validateProjectCreate(input as never);
      else if (kind === "inventory") validateQuestItemCreate(input as never);
      else if (!canonicalContainer) throw new Error("Falta el Container canónico.");
      if (!draft.name.trim()) throw new TlozValidationError({ name: "El nombre es obligatorio." });
      if (!draft.description.trim()) throw new TlozValidationError({ description: "La descripción es obligatoria." });
      if (!draft.ownerId) throw new TlozValidationError({ ownerId: "El responsable es obligatorio." });
      if (!/^#[0-9A-F]{6}$/i.test(draft.color)) throw new TlozValidationError({ color: "El color debe ser un HEX válido." });
      submitting.current = true;
      onPendingChange?.(true);
      startTransition(async () => {
        const toastId = toast.loading(`Creando ${kindLabel[kind]}…`, { toasterId });
        try {
          if (kind === "mission") await createMission(input as never, documentProperties);
          else if (kind === "project") await createProject(input as never);
          else if (kind === "inventory") await createQuestItem(input as never);
          else await createCanonicalContent(canonicalContainer!, draft);
          toast.success(`${kindLabel[kind]} creado`, { id: toastId, toasterId }); reset(); onDone?.(); router.refresh();
        } catch (error) {
          const message = tlozErrorMessage(error, "No se pudo crear. Revisa los datos e intenta de nuevo.");
          setErrors({ form: message });
          toast.error(message, { id: toastId, toasterId });
        } finally {
          submitting.current = false;
          onPendingChange?.(false);
        }
      });
    } catch (error) { if (error instanceof TlozValidationError) setErrors(error.fields); else setErrors({ form: tlozErrorMessage(error, "No se pudo crear. Intenta nuevamente.") }); }
  }
  return (
    <form id={formId} onSubmit={submit} aria-busy={pending} className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 sm:p-6" noValidate>
      <fieldset disabled={pending} className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
      {errors.form ? <p role="alert" className="text-xs font-semibold text-zivelo">{errors.form}</p> : null}
      <div><h3 className="mb-1 text-xl font-bold text-carbon">Nuevo {kindLabel[kind]}</h3><p className="m-0 text-sm text-carbon/55">Completa los datos requeridos antes de guardar.</p></div>
      {kind === "mission" ? <div className="flex items-end gap-2"><IconPicker disabled={pending} icons={icons} value={draft.icon} label="Icono de misión" recentStorageKey="tloz-recent-icons" onValueChange={(icon) => field("icon", icon)} iconOnly className="size-10 shrink-0 justify-center" /><div className="min-w-0 flex-1"><FormField label="Título" error={errors.title} required><Input autoFocus value={draft.name} maxLength={160} onChange={(event) => field("name", event.target.value)} /></FormField></div></div> : <FormField label="Nombre" error={errors.name} required><Input autoFocus value={draft.name} maxLength={160} onChange={(event) => field("name", event.target.value)} /></FormField>}
      <FormField label="Descripción" required error={errors.description}><textarea className="min-h-24 w-full rounded-xl border border-carbon/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-zivelo/50 focus:ring-2 focus:ring-zivelo/10" value={draft.description} rows={4} maxLength={kind === "mission" ? 280 : 5000} onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => field("description", event.target.value)} /></FormField>
      {kind === "mission" ? <FormField label="Detalle" error={errors.descriptionDetail}><textarea className="min-h-40 w-full rounded-xl border border-carbon/15 bg-white px-3 py-2 font-mono text-[13px] leading-[1.6] outline-none transition focus:border-zivelo/50 focus:ring-2 focus:ring-zivelo/10" value={draft.descriptionDetail} rows={8} maxLength={20000} placeholder="Markdown, incluyendo - [ ] tasks…" onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => field("descriptionDetail", event.target.value)} /></FormField> : null}
      {kind !== "mission" ? <div className="grid gap-4 sm:grid-cols-2"><FormField label="Icono" error={errors.icon} required><IconPicker disabled={pending} icons={icons} value={draft.icon} onValueChange={(icon) => field("icon", icon)} /></FormField>
        <FormField label="Color" error={errors.color} required><ColorPicker value={draft.color} onValueChange={(color) => field("color", color)} /></FormField>
        {(kind === "inventory" || kind === "library" || kind === "workshop") ? <FormField label="Categoría"><Select disabled={pending} value={draft.category} onValueChange={(value) => field("category", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{[["tool","Herramienta"],["access","Acceso"],["asset","Activo"],["document","Documento"],["other","Otro"]].map(([id,label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectGroup></SelectContent></Select></FormField> : null}
      </div> : null}
      {kind === "mission" ? <CreateSection title="Propiedades"><MissionPropertyFields disabled={pending} layout="grid" values={{ status: draft.status as MissionPropertyValues["status"], type: draft.type as MissionPropertyValues["type"], ownerId: draft.ownerId, projectId: draft.projectId, startDate: draft.startDate, dueDate: draft.dueDate }} options={{ projects, users, missions, contract: missionContract }} onChange={missionField} /></CreateSection> : <FormField label="Responsable" error={errors.ownerId} required><UserPicker disabled={pending} users={users} value={draft.ownerId || undefined} allowEmpty={false} onValueChange={(ownerId) => field("ownerId", ownerId)} /></FormField>}
      {kind === "mission" ? <CreateSection title="Campos del Project"><CreateDocumentPropertyInputs fields={missionContract} values={documentProperties} users={users} onChange={(key, value) => { if (!submitting.current) setDocumentProperties((current) => ({ ...current, [key]: value })); }} /></CreateSection> : null}
      {kind === "mission" ? <MissionRelations pending={pending} draft={draft} field={field} missions={missions} questItems={questItems} resources={resources} setResources={setResources} /> : null}
      {kind === "project" || kind === "workshop" ? <div className="grid gap-4 sm:grid-cols-2"><FormField label="Inicio" error={errors.startDate} required><DatePicker disabled={pending} value={draft.startDate || undefined} label="Fecha de inicio" onValueChange={(value) => field("startDate", value ?? "")} /></FormField><FormField label="Vence" error={errors.dueDate}><DatePicker disabled={pending} value={draft.dueDate || undefined} label="Fecha límite" onValueChange={(value) => field("dueDate", value ?? "")} /></FormField></div> : null}
      {showActions ? <div className="sticky bottom-0 flex justify-end border-t border-carbon/10 bg-paper py-3"><Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Guardar"}</Button></div> : null}
      </fieldset>
    </form>
  );
}

function CreateEntitySlideOver({ open, onOpenChange, kind, projects, users, missions, questItems, projectContracts, fixedProjectId, canonicalContainer }: { open: boolean; onOpenChange: (open: boolean) => void; kind: TlozCreateKind; projects: TlozProject[]; users: UserProfile[]; missions: TlozMissionRecord[]; questItems: TlozQuestItem[]; projectContracts: Record<string, TlozFieldDefinition[]>; fixedProjectId?: string; canonicalContainer?: ContainerRecord }) {
  const [pending, setPending] = useState(false);
  return <SlideOver dismissible={!pending} open={open} title={`Crear ${kindLabel[kind]}`} onOpenChange={onOpenChange} footer={<><Button type="button" variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={pending} form={`create-${kind}-form`}>{pending ? "Guardando…" : "Guardar"}</Button></>}>
    <CreateForm showActions={false} onPendingChange={setPending} key={String(open)} kind={kind} projects={projects} users={users} missions={missions} questItems={questItems} projectContracts={projectContracts} fixedProjectId={fixedProjectId} canonicalContainer={canonicalContainer} onDone={() => onOpenChange(false)} />
  </SlideOver>;
}

async function createCanonicalContent(container: ContainerRecord, draft: Record<string, string>) {
  const response = await fetch("/api/v2/contents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      publicId: `${container.presentation}-${crypto.randomUUID()}`,
      containerId: container.id,
      presentation: container.presentation,
      title: draft.name.trim(),
      summary: draft.description.trim(),
      data: {
        icon: draft.icon,
        color: draft.color,
        status: container.presentation === "library" ? "locked" : "active",
        ownerId: draft.ownerId,
        category: draft.category || "other",
        ...(draft.startDate ? { startDate: draft.startDate } : {}),
        ...(draft.dueDate ? { dueDate: draft.dueDate } : {}),
      },
    }),
  });
  if (!response.ok) throw new Error("No se pudo crear el contenido canónico.");
}

function FormField({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  const id = useId();
  const control = isValidElement<{ id?: string; required?: boolean; "aria-invalid"?: boolean; "aria-describedby"?: string }>(children)
    && (children.type === Input || children.type === "textarea" || children.type === "input")
    ? cloneElement(children, { id, required, "aria-invalid": Boolean(error), "aria-describedby": error ? `${id}-error` : undefined })
    : children;
  return <label className="flex flex-col gap-1.5"><span className="text-xs font-bold text-carbon/60">{label}{required ? <span className="text-zivelo"> *</span> : null}</span>{control}{error ? <span id={`${id}-error`} role="alert" className="text-xs font-medium text-[#B91C22]">{error}</span> : null}</label>;
}
function MissionRelations({ pending, draft, field, missions, questItems, resources, setResources }: { pending: boolean; draft: Record<string, string>; field: (name: string, value: string) => void; missions: TlozMissionRecord[]; questItems: TlozQuestItem[]; resources: TlozResourceInput[]; setResources: React.Dispatch<React.SetStateAction<TlozResourceInput[]>> }) {
  const dependencyIds = splitCreateIds(draft.dependencyIds);
  const questIds = splitCreateIds(draft.requiredQuestItemIds);
  const add = (name: string, id: string) => field(name, [...new Set([...splitCreateIds(draft[name]), id])].join(","));
  const remove = (name: string, id: string) => field(name, splitCreateIds(draft[name]).filter((value) => value !== id).join(","));
  const missionOptions = missions.filter((item) => item.id !== draft.id).map((item) => ({ id: item.id, name: `${item.displayId} · ${item.title}`, iconComponent: resolveMissionIcon(item.icon) }));
  const questOptions = questItems.map((item) => ({ id: item.id, name: item.name, iconComponent: resolveMissionIcon(item.icon) }));
  return <div className="flex flex-col gap-5"><CreateSection title="Dependencias"><div className="flex flex-col gap-2">{dependencyIds.map((id) => <SelectedRelation key={id} label={missions.find((item) => item.id === id)?.title ?? id} onRemove={() => { if (!pending) remove("dependencyIds", id); }} />)}<AddDependency relationType="mission" missions={missionOptions.filter((item) => !dependencyIds.includes(item.id))} questItems={[]} onAddMission={(id) => { if (!pending) add("dependencyIds", id); }} onAddQuestItem={() => undefined} /></div></CreateSection><CreateSection title="Quest Items"><div className="flex flex-col gap-2">{questIds.map((id) => <SelectedRelation key={id} label={questItems.find((item) => item.id === id)?.name ?? id} onRemove={() => { if (!pending) remove("requiredQuestItemIds", id); }} />)}<AddDependency relationType="quest" missions={[]} questItems={questOptions.filter((item) => !questIds.includes(item.id))} onAddMission={() => undefined} onAddQuestItem={(id) => { if (!pending) add("requiredQuestItemIds", id); }} /></div></CreateSection><CreateSection title="Attachments / Resources"><div className="flex min-w-0 flex-col gap-2">{resources.map((resource, index) => <SelectedRelation key={`${resource.title}-${index}`} label={resource.title || "Nuevo recurso"} onRemove={() => { if (!pending) setResources((items) => items.filter((_, itemIndex) => itemIndex !== index)); }} />)}<AddResource onAdd={(resource) => { if (!pending) setResources((items) => [...items, resource]); }} /></div></CreateSection></div>;
}

function CreateSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-xl border border-carbon/10 bg-carbon/[0.025] p-4"><h4 className="mb-3 mt-0 text-[13px] font-bold text-carbon">{title}</h4>{children}</section>; }
function SelectedRelation({ label, onRemove }: { label: string; onRemove: () => void }) { return <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm"><span className="truncate font-semibold">{label}</span><Button type="button" variant="ghost" size="sm" onClick={onRemove}>Quitar</Button></div>; }
