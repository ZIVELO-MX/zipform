"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Check, ExternalLink, File, FileText, ImageIcon, Link2, Lock, Plus, StickyNote, Unlock, X } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, Button, ColorPicker, DatePicker, IconPicker, Input, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, SlideOver, toast, UserAvatarLabel, UserPicker, type IconPickerOption } from "@zipform/ui";
import type { TlozInventoryCategory, TlozProject, TlozProjectStatus, TlozProjectType, TlozQuestItem, TlozResource, TlozResourceType } from "@zipform/types";
import type { TlozMissionRecord } from "../../lib/tloz-data";
import { addProjectResource, addQuestItemResource, getEntityResources, removeProjectResource, removeQuestItemResource, updateProject, updateQuestItem } from "../../app/tloz/actions";
import { inventoryItemHref, missionHref, projectDetailHref, projectHref } from "../../lib/tloz-routes";
import { formatDate, resolveMissionIcon } from "./tloz-utils";
import { useTlozViewState } from "./tloz-view-state";
import { DetailPropertyRow } from "./detail-property-row";
import { MarkdownEditor } from "./markdown-editor";

const icons: IconPickerOption[] = ["Folder", "FolderKanban", "Sword", "Sparkles", "Shield", "Database", "KeyRound", "FileCheck", "Wrench", "PackageOpen"].map((id) => ({ id, label: id, icon: resolveMissionIcon(id) }));
const projectStatusLabel: Record<TlozProjectStatus, string> = { planned: "Planeado", active: "Activo", archived: "Archivado" };
const projectTypeLabel: Record<TlozProjectType, string> = { normal: "Normal", system: "Sistema" };
const categoryLabel: Record<TlozInventoryCategory, string> = { tool: "Herramienta", access: "Acceso", asset: "Activo", document: "Documento", other: "Otro" };
type DetailUser = { id: string; name: string; username?: string; avatarUrl?: string };

type DetailProps = {
  variant: "project";
  entity: TlozProject;
  missions: TlozMissionRecord[];
  users: DetailUser[];
  resources: TlozResource[];
} | {
  variant: "inventory";
  entity: TlozQuestItem;
  missions: TlozMissionRecord[];
  users: DetailUser[];
  resources: TlozResource[];
};

export function SystemEntitySlideOver({ detail, onClose, onChange, users, missions, resources, onNavigateMission }: {
  detail: ({ variant: "project"; entity: TlozProject } | { variant: "inventory"; entity: TlozQuestItem }) | null;
  onClose: () => void;
  onChange: (entity: TlozProject | TlozQuestItem) => void;
  users: DetailUser[];
  missions: TlozMissionRecord[];
  resources: TlozResource[];
  onNavigateMission?: (mission: TlozMissionRecord) => void;
}) {
  const router = useRouter();
  const fullHref = detail?.variant === "project" ? projectDetailHref(detail.entity.id) : detail ? inventoryItemHref(detail.entity.id) : "/tloz";
  return <SlideOver open={Boolean(detail)} title={detail?.entity.name ?? "Detalle"} onOpenChange={(open) => !open && onClose()}>
    {detail ? <SystemEntityDetail variant={detail.variant} entity={detail.entity as never} users={users} missions={missions} resources={resources} panel onChange={onChange} onNavigateMission={onNavigateMission} onOpenFullPage={() => { onClose(); router.push(fullHref); }} /> : null}
  </SlideOver>;
}

type SystemEditableField = "status" | "type" | "color" | "owner" | "startDate" | "dueDate" | "category";

export function SystemEntityDetail(props: DetailProps & { panel?: boolean; onChange?: (entity: TlozProject | TlozQuestItem) => void; onNavigateMission?: (mission: TlozMissionRecord) => void; onOpenFullPage?: () => void }) {
  const { variant, users, missions, resources: initialResources, panel = false, onChange } = props;
  const [entity, setEntity] = useState<TlozProject | TlozQuestItem>(props.entity);
  const [resources, setResources] = useState(initialResources);
  const [pending, startTransition] = useTransition();
  const [activeField, setActiveField] = useState<SystemEditableField | null>(null);
  const { setState } = useTlozViewState();
  const router = useRouter();
  useEffect(() => setEntity(props.entity), [props.entity]);
  useEffect(() => {
    let active = true;
    setResources(initialResources);
    void getEntityResources(variant, props.entity.id).then((next) => { if (active) setResources(next); });
    return () => { active = false; };
  }, [initialResources, props.entity.id, variant]);
  const project = variant === "project" ? entity as TlozProject : null;
  const item = variant === "inventory" ? entity as TlozQuestItem : null;
  const relatedMissions = project ? missions.filter((mission) => mission.projectId === project.id) : missions.filter((mission) => mission.questItems.some((quest) => quest.id === item?.id));
  const tone = project?.color ?? "#7A5A12";

  function persist(input: Record<string, string | undefined>, label = "Guardando cambios…") {
    setActiveField(null);
    const toastId = toast.loading(label);
    startTransition(async () => {
      try {
        const next = variant === "project" ? await updateProject(entity.id, input) : await updateQuestItem(entity.id, input);
        setEntity(next); onChange?.(next); toast.success("Cambios guardados", { id: toastId });
      } catch { toast.error("No se pudieron guardar los cambios", { id: toastId }); }
    });
  }

  async function addResource(input: { type: TlozResourceType; title: string; url?: string; fileId?: string }) {
    const next = variant === "project" ? await addProjectResource(entity.id, input) : await addQuestItemResource(entity.id, input);
    setResources(next);
  }
  async function removeResource(id: string) {
    const next = variant === "project" ? await removeProjectResource(entity.id, id) : await removeQuestItemResource(entity.id, id);
    setResources(next);
  }

  return <article className={`mission-detail-workspace ${panel ? "px-5 py-6 min-h-full bg-[#FAFAF9]" : "mx-auto w-full max-w-[1052px] px-[26px] py-7"}`}>
    {!panel ? <Breadcrumb className="mb-5"><BreadcrumbList className="flex-nowrap text-carbon/60"><BreadcrumbItem><BreadcrumbLink asChild><Link href={variant === "project" ? "/tloz/projects" : "/tloz/inventory"}>{variant === "project" ? "Projects" : "Inventory"}</Link></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem className="min-w-0"><BreadcrumbPage className="truncate">{entity.name}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb> : null}
    <div className="mission-detail-layout grid min-w-0 gap-[30px]">
      <main className="min-w-0">
        <header className="mb-6">
          <div className="mb-3 flex items-center gap-2"><span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: `${tone}18`, color: tone }}>{project ? projectTypeLabel[project.type] : categoryLabel[item!.category]}</span></div>
          <div className="flex items-start gap-2.5"><IconPicker label="Icono" value={entity.icon} icons={icons} color={tone} iconOnly className="mt-0.5 size-8 shrink-0 justify-center rounded-lg border-0 bg-white p-0 shadow-none [&_svg]:size-[15px]" onValueChange={(icon) => persist({ icon })} /><EditableText value={entity.name} className="text-[30px] font-bold leading-[1.12] tracking-[-0.025em]" onSave={(name) => persist({ name })} /></div>
        </header>
        <EditableText value={entity.description} multiline placeholder="Añadir descripción corta…" className="mb-2 block min-h-24 w-full text-[15px] leading-[1.6] text-[#454543]" onSave={(description) => persist({ description })} />
        <MarkdownEditor value={entity.descriptionDetail} onSave={(descriptionDetail) => persist({ descriptionDetail })} />

        <DetailSection title={project ? "Missions" : "Usado por"}>
          {relatedMissions.map((mission) => props.onNavigateMission ? <button key={mission.id} type="button" onClick={() => props.onNavigateMission?.(mission)} className="flex items-center gap-3 rounded-xl border border-carbon/10 bg-white px-3.5 py-3 text-left text-carbon hover:border-zivelo/25"><span className="grid size-7 place-items-center rounded-lg bg-carbon/5"><FileText size={13} /></span><span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{mission.title}</span><span className="text-[11px] text-carbon/45">{mission.status}</span></button> : <Link key={mission.id} href={mission.project ? missionHref(mission.project, mission.displayId) : "/tloz"} className="flex items-center gap-3 rounded-xl border border-carbon/10 bg-white px-3.5 py-3 text-carbon no-underline hover:border-zivelo/25"><span className="grid size-7 place-items-center rounded-lg bg-carbon/5"><FileText size={13} /></span><span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{mission.title}</span><span className="text-[11px] text-carbon/45">{mission.status}</span></Link>)}
          {!relatedMissions.length ? <p className="text-sm text-carbon/45">Sin missions relacionadas.</p> : null}
        </DetailSection>

        <DetailSection title="Recursos" className="mt-7"><div className="mission-resource-grid grid grid-cols-2 gap-2.5">{resources.map((resource) => <ResourceCard key={resource.id} resource={resource} onRemove={() => void removeResource(resource.id)} />)}<AddResource onAdd={(input) => void addResource(input)} /></div></DetailSection>
      </main>

      <aside className="mission-detail-properties flex self-start flex-col gap-3.5" aria-label="Propiedades">
        {panel ? <Button type="button" variant="outline" className="min-h-11 rounded-xl bg-white text-carbon/60" onClick={props.onOpenFullPage}><ExternalLink size={14} />Abrir en página completa</Button> : null}
        <section className="overflow-hidden rounded-2xl border border-carbon/10 bg-white"><h2 className="m-0 border-b border-carbon/[0.07] px-4 py-[13px] text-[11px] font-bold uppercase tracking-[0.05em] text-carbon/45">Propiedades</h2><div className="space-y-1 px-3 py-2">
          {project ? <>
            <DetailPropertyRow label="Estado" display={<StatusDisplay label={projectStatusLabel[project.status]} tone={project.color} />} editing={activeField === "status"} onEdit={(editing) => setActiveField(editing ? "status" : null)}><Select value={project.status} onValueChange={(status) => persist({ status })}><SelectTrigger aria-label="Estado"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{Object.entries(projectStatusLabel).map(([id, label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectGroup></SelectContent></Select></DetailPropertyRow>
            <DetailPropertyRow label="Tipo" display={<span>{projectTypeLabel[project.type]}</span>} editing={activeField === "type"} onEdit={(editing) => setActiveField(editing ? "type" : null)}><Select value={project.type} onValueChange={(type) => persist({ type })}><SelectTrigger aria-label="Tipo"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{Object.entries(projectTypeLabel).map(([id, label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectGroup></SelectContent></Select></DetailPropertyRow>
            <DetailPropertyRow label="Color" display={<span className="inline-flex items-center gap-2"><span className="size-3 rounded-full" style={{ backgroundColor: project.color }} />{project.color.toUpperCase()}</span>} editing={activeField === "color"} onEdit={(editing) => setActiveField(editing ? "color" : null)}><ColorPicker value={project.color} onValueChange={(color) => persist({ color })} /></DetailPropertyRow>
            <DetailPropertyRow label="Responsable" display={<OwnerDisplay ownerId={project.ownerId} users={users} />} editing={activeField === "owner"} onEdit={(editing) => setActiveField(editing ? "owner" : null)}><UserPicker users={users} value={project.ownerId} onValueChange={(ownerId) => persist({ ownerId })} /></DetailPropertyRow>
            <DetailPropertyRow label="Inicio" display={<span className="font-mono">{formatDate(project.startDate)}</span>} editing={activeField === "startDate"} onEdit={(editing) => setActiveField(editing ? "startDate" : null)}><DatePicker value={project.startDate} label="Fecha de inicio" clearable={false} onValueChange={(startDate) => startDate && persist({ startDate })} /></DetailPropertyRow>
            <DetailPropertyRow label="Vence" display={<span className="font-mono text-[#B91C22]">{formatDate(project.dueDate)}</span>} editing={activeField === "dueDate"} onEdit={(editing) => setActiveField(editing ? "dueDate" : null)}><DatePicker value={project.dueDate} label="Fecha límite" onValueChange={(dueDate) => persist({ dueDate: dueDate ?? "" })} /></DetailPropertyRow>
          </> : <>
            <DetailPropertyRow label="Estado" display={<StatusDisplay label={item!.status === "unlocked" ? "Desbloqueado" : "Bloqueado"} tone={item!.status === "unlocked" ? "#1E8E5A" : "#7A5A12"} />} editing={false} onEdit={() => undefined} readOnly><span /></DetailPropertyRow>
            <DetailPropertyRow label="Categoría" display={<span>{categoryLabel[item!.category]}</span>} editing={activeField === "category"} onEdit={(editing) => setActiveField(editing ? "category" : null)}><Select value={item!.category} onValueChange={(category) => persist({ category })}><SelectTrigger aria-label="Categoría"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{Object.entries(categoryLabel).map(([id, label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectGroup></SelectContent></Select></DetailPropertyRow>
            <DetailPropertyRow label="Responsable" display={<OwnerDisplay ownerId={item!.ownerId} users={users} />} editing={activeField === "owner"} onEdit={(editing) => setActiveField(editing ? "owner" : null)}><UserPicker users={users} value={item!.ownerId} allowEmpty onValueChange={(ownerId) => persist({ ownerId })} /></DetailPropertyRow>
          </>}
        </div></section>
        <section className="overflow-hidden rounded-2xl border border-carbon/10 bg-white"><h2 className="m-0 border-b border-carbon/[0.07] px-4 py-[13px] text-[11px] font-bold uppercase tracking-[0.05em] text-carbon/45">Actividad</h2><div className="space-y-3 p-4 text-xs text-carbon/60"><Activity label="Entidad actualizada" date={entity.updatedAt} tone={tone} /><Activity label="Entidad creada" date={entity.createdAt} /></div></section>
        {project ? <Button className="min-h-11 rounded-xl" onClick={() => { setState({ view: "list" }); router.push(projectHref(project)); }}>Ver todas las missions</Button> : <Button className="min-h-11 rounded-xl" disabled={pending} onClick={() => persist({ status: item!.status === "unlocked" ? "locked" : "unlocked", acquiredAt: item!.status === "unlocked" ? "" : new Date().toISOString().slice(0, 10) }, item!.status === "unlocked" ? "Bloqueando item…" : "Desbloqueando item…")}>{item!.status === "unlocked" ? <Lock /> : <Unlock />}{item!.status === "unlocked" ? "Marcar como bloqueado" : "Marcar como desbloqueado"}</Button>}
      </aside>
    </div>
  </article>;
}

function EditableText({ value, onSave, multiline = false, placeholder, className = "" }: { value: string; onSave: (value: string) => void; multiline?: boolean; placeholder?: string; className?: string }) {
  const [draft, setDraft] = useState(value); useEffect(() => setDraft(value), [value]);
  if (multiline) return <textarea className={`resize-none border-0 bg-transparent p-0 outline-none focus:ring-0 ${className}`} value={draft} placeholder={placeholder} onChange={(event) => setDraft(event.target.value)} onBlur={() => draft !== value && onSave(draft)} />;
  return <input className={`min-w-0 flex-1 border-0 bg-transparent p-0 text-carbon outline-none focus:ring-0 ${className}`} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => draft.trim() && draft !== value && onSave(draft.trim())} />;
}
function StatusDisplay({ label, tone }: { label: string; tone: string }) { return <span className="inline-flex items-center gap-1.5" style={{ color: tone }}><span className="size-[7px] rounded-full bg-current" />{label}</span>; }
function OwnerDisplay({ ownerId, users }: { ownerId?: string; users: DetailUser[] }) { const user = users.find((candidate) => candidate.id === ownerId); return user ? <UserAvatarLabel name={user.name} label={user.username ?? user.name} labelOnly imageUrl={user.avatarUrl} size="sm" /> : <span className="text-carbon/45">Sin responsable</span>; }
function DetailSection({ title, className = "", children }: { title: string; className?: string; children: React.ReactNode }) { return <section className={className}><h2 className="mb-[13px] text-[13px] font-bold uppercase tracking-[0.04em] text-carbon/75">{title}</h2><div className="flex flex-col gap-2.5">{children}</div></section>; }
function Activity({ label, date, tone = "#9a9a98" }: { label: string; date: string; tone?: string }) { return <div className="flex gap-2.5"><span className="mt-1 size-2 rounded-full" style={{ background: tone }} /><span><strong className="block text-carbon/75">{label}</strong><time className="font-mono text-[10.5px] text-carbon/40">{new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date))}</time></span></div>; }
const resourceIcon: Record<TlozResourceType, React.ElementType> = { link: Link2, document: FileText, image: ImageIcon, file: File, note: StickyNote };
const resourceLabel: Record<TlozResourceType, string> = { link: "Enlace", document: "Documento", image: "Imagen", file: "Archivo", note: "Nota" };
function ResourceCard({ resource, onRemove }: { resource: TlozResource; onRemove: () => void }) { const Icon = resourceIcon[resource.type]; const content = <><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#EEF2FF] text-[#3A47B5]"><Icon size={13} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{resource.title}</strong><span className="block truncate text-xs text-carbon/45">{resourceLabel[resource.type]}</span></span></>; return <div className="group flex items-center gap-2 rounded-xl border border-carbon/10 bg-white px-3 py-3">{resource.url ? <a className="flex min-w-0 flex-1 items-center gap-3 text-carbon no-underline" href={resource.url} target="_blank" rel="noreferrer">{content}</a> : <div className="flex min-w-0 flex-1 items-center gap-3">{content}</div>}<Button type="button" variant="ghost" size="icon-xs" aria-label={`Eliminar ${resource.title}`} onClick={onRemove}><X /></Button></div>; }
function AddResource({ onAdd }: { onAdd: (input: { type: TlozResourceType; title: string; url?: string; fileId?: string }) => void }) { const [adding, setAdding] = useState(false); const [title, setTitle] = useState(""); const [location, setLocation] = useState(""); const [type, setType] = useState<TlozResourceType>("link"); const usesFileId = type === "file" || type === "document" || type === "image"; if (!adding) return <button type="button" className="col-span-full flex min-h-11 items-center justify-center gap-2 rounded-xl border border-dashed border-carbon/15 text-[13px] font-semibold text-carbon/55 hover:text-zivelo" onClick={() => setAdding(true)}><Plus size={14} />Agregar nuevo</button>; return <div className="col-span-full grid gap-2 sm:grid-cols-[130px_1fr_1fr_auto] w-full"><Select value={type} onValueChange={(value) => setType(value as TlozResourceType)}><SelectTrigger aria-label="Tipo de recurso"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{Object.entries(resourceLabel).map(([id, label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectGroup></SelectContent></Select><Input autoFocus placeholder="Título" value={title} onChange={(event) => setTitle(event.target.value)} /><Input placeholder={usesFileId ? "ID del archivo" : "https://…"} value={location} onChange={(event) => setLocation(event.target.value)} /><div className="flex gap-1"><Button disabled={!title.trim()} onClick={() => { onAdd({ type, title: title.trim(), ...(location.trim() ? usesFileId ? { fileId: location.trim() } : { url: location.trim() } : {}) }); setTitle(""); setLocation(""); setAdding(false); }}><Check /></Button><Button variant="ghost" onClick={() => setAdding(false)}><X /></Button></div></div>; }
