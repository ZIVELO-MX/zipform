"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Check, FileStack, MoreHorizontal, PanelRightOpen, Pencil, Plus, Trash2, X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, Button, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, EntityPicker, IconPicker, Input, MetricProgress, ResourcePreview, SegmentedControl, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, Separator, toast, Tooltip, TooltipContent, TooltipTrigger, useOverlayToasterId, type EntityPickerOption, type IconPickerOption, type ResourcePreviewSlide } from "@zipform/ui";
import type { TlozMissionDetail, TlozMissionRecord } from "../../lib/tloz-data";
import type { TlozAttachmentGroup, TlozProject, TlozQuestItem, TlozResource, TlozResourceType } from "@zipform/types";
import {
  addMissionDependency,
  addMissionResource,
  removeMissionDependency,
  removeMissionQuestItem,
  removeMissionResource,
  saveMissionDocument,
  setMissionQuestItem,
  patchMissionStatus,
  updateMission,
} from "../../app/tloz/actions";
import { MissionInlineEditor, type MissionEditorOptions } from "./mission-inline-editor";
import { MissionAttachmentUploader } from "./mission-attachment-uploader";
import { missionStatusLabel, missionStatusTone, missionTypeIcon, missionTypeLabel, missionTypeTone, resolveMissionIcon } from "./tloz-utils";
import { inventoryItemHref, missionHref, projectHref } from "../../lib/tloz-routes";
import { appendTaskLine, updateTaskLine } from "./mission-document";
import { MarkdownEditor } from "./markdown-editor";
import { inferResourceIconId, isGithubUrl, RESOURCE_ICON_OPTIONS, resourceTypeLabel, resolveResourceIcon, resolveResourceImageUrl, resourceUsesFileId, TLOZ_ICON_OPTIONS } from "./tloz-icon-catalog";
import type { TlozResourceInput } from "@zipform/data";

const missionIcons: IconPickerOption[] = TLOZ_ICON_OPTIONS;
const defaultMissionContentSections = ["description", "detail", "checklist"];
const MISSION_ATTACHMENT_UPLOAD_UI_ENABLED = false;

export type MissionDetailOptions = Omit<MissionEditorOptions, "missions"> & {
  missions: TlozMissionRecord[];
  questItems: TlozQuestItem[];
};

type EditableSnapshot = Pick<TlozMissionDetail, "title" | "description" | "descriptionDetail" | "icon">;

export function MissionDetail({ mission, options, canUpdate = true, onMissionChange, onNavigateMission, onNavigateQuestItem, variant = "full" }: {
  mission: TlozMissionDetail;
  options: MissionDetailOptions;
  canUpdate?: boolean;
  onMissionChange?: (mission: TlozMissionDetail) => void;
  onNavigateMission?: (missionId: string) => void;
  onNavigateQuestItem?: (questItemId: string) => void;
  variant?: "panel" | "full";
}) {
  const fullMissionHref = mission.project ? missionHref(mission.project, mission.displayId) : "/tloz";
  const [current, setCurrent] = useState(mission);
  const [detailMarkdown, setDetailMarkdown] = useState(mission.descriptionDetail);
  const [descriptionDraft, setDescriptionDraft] = useState(mission.description);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(mission.title);
  const [renamingChecklist, setRenamingChecklist] = useState<number | null>(null);
  const [checklistTitleDraft, setChecklistTitleDraft] = useState("");
  const [deletingChecklist, setDeletingChecklist] = useState<number | null>(null);
  const [checklistFilter, setChecklistFilter] = useState<"all" | "pending">("all");
  const undoStack = useRef<EditableSnapshot[]>([]);
  const redoStack = useRef<EditableSnapshot[]>([]);
  const skipTitleSave = useRef(false);
  const skipDescriptionSave = useRef(false);
  const [isPending, startTransition] = useTransition();
  const toasterId = useOverlayToasterId();
  const tone = missionTypeTone[current.type];
  const checklistProgress = current.checklist.length ? Math.round((current.checklist.filter((item) => item.completed).length / current.checklist.length) * 100) : 0;

  useEffect(() => { setCurrent(mission); setDetailMarkdown(mission.descriptionDetail); setDescriptionDraft(mission.description); setTitleDraft(mission.title); }, [mission]);

  useEffect(() => {
    function handleHistoryShortcut(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target instanceof HTMLElement && target.isContentEditable)) return;
      const redo = (event.key.toLowerCase() === "z" && event.shiftKey) || event.key.toLowerCase() === "y";
      const undo = event.key.toLowerCase() === "z" && !event.shiftKey;
      if (!undo && !redo) return;
      const source = redo ? redoStack : undoStack;
      const destination = redo ? undoStack : redoStack;
      const snapshot = source.current.pop();
      if (!snapshot) return;
      event.preventDefault();
      destination.current.push(snapshotOf(current));
      restoreSnapshot(snapshot, redo ? "Cambio rehecho" : "Cambio deshecho");
    }
    window.addEventListener("keydown", handleHistoryShortcut);
    return () => window.removeEventListener("keydown", handleHistoryShortcut);
  });

  function accept(next: TlozMissionDetail) {
    if (next.descriptionDetail !== current.descriptionDetail) setDetailMarkdown(next.descriptionDetail);
    setCurrent(next);
    onMissionChange?.(next);
  }

  function mutate(label: string, operation: () => Promise<TlozMissionDetail>) {
    const toastId = toast.loading(label, { toasterId });
    startTransition(async () => {
      try { accept(await operation()); toast.success("Cambios guardados", { id: toastId, toasterId }); }
      catch { toast.error("No se pudieron guardar los cambios", { id: toastId, toasterId }); }
    });
  }

  function remember() {
    undoStack.current.push(snapshotOf(current));
    if (undoStack.current.length > 30) undoStack.current.shift();
    redoStack.current = [];
  }

  function restoreSnapshot(snapshot: EditableSnapshot, message: string) {
    startTransition(async () => {
      try {
        await updateMission(current.id, { title: snapshot.title, description: snapshot.description, icon: snapshot.icon });
        const restored = await saveMissionDocument(current.id, snapshot.descriptionDetail);
        accept(restored);
        setTitleDraft(snapshot.title);
        toast.success(message, { toasterId });
      } catch { toast.error("No se pudo restaurar el cambio", { toasterId }); }
    });
  }

  function saveIcon(value: string) {
    if (value === current.icon) return;
    remember();
    const toastId = toast.loading("Actualizando icono…", { toasterId });
    startTransition(async () => {
      try { accept({ ...current, ...(await updateMission(current.id, { icon: value })) }); toast.success("Icono actualizado", { id: toastId, toasterId }); }
      catch { toast.error("No se pudo actualizar el icono", { id: toastId, toasterId }); }
    });
  }

  function saveTitle() {
    if (skipTitleSave.current) { skipTitleSave.current = false; setTitleDraft(current.title); return; }
    const title = titleDraft.trim();
    setEditingTitle(false);
    if (!title || title === current.title) { setTitleDraft(current.title); return; }
    remember();
    const toastId = toast.loading("Actualizando título…", { toasterId });
    startTransition(async () => {
      try { accept({ ...current, ...(await updateMission(current.id, { title })) }); toast.success("Título actualizado", { id: toastId, toasterId }); }
      catch { setTitleDraft(current.title); toast.error("No se pudo actualizar el título", { id: toastId, toasterId }); }
    });
  }

  function saveDocument(nextMarkdown = detailMarkdown) {
    if (nextMarkdown === current.descriptionDetail) return;
    remember();
    setDetailMarkdown(nextMarkdown);
    mutate("Guardando documento…", () => saveMissionDocument(current.id, nextMarkdown));
  }

  function saveDescription() {
    if (descriptionDraft.trim() === current.description) return;
    remember();
    mutate("Guardando descripción…", async () => ({ ...current, ...(await updateMission(current.id, { description: descriptionDraft.trim() })) }));
  }

  function toggleChecklistItem(position: number, checked: boolean) {
    saveDocument(updateTaskLine(detailMarkdown, position, { completed: checked }));
  }

  function acceptAttachmentGroup(group: TlozAttachmentGroup) {
    const nextResources = [
      ...current.resources.filter((resource) => resource.groupKey !== group.groupKey),
      ...group.attachments,
    ];
    accept({ ...current, resources: nextResources });
  }

  function renameChecklistItem(position: number) {
    const title = checklistTitleDraft.trim();
    setRenamingChecklist(null);
    if (!title || title === current.checklist[position]?.title) return;
    saveDocument(updateTaskLine(detailMarkdown, position, { title }));
  }

  function deleteChecklistItem(position: number) {
    saveDocument(updateTaskLine(detailMarkdown, position, { remove: true }));
    setDeletingChecklist(null);
  }

  const typeBadgeClass = current.type === "main_quest" ? "bg-[#FDECEC] text-[#B91C22]" : current.type === "side_quest" ? "bg-[#EEF2FF] text-[#2D6CDF]" : current.type === "farming_quest" ? "bg-[#E6F4EA] text-[#1E6B3C]" : "bg-[#F2EAFE] text-[#7A4ED9]";
  const iconSurfaceClass = missionTypeSurfaceClass[current.type];
  const statusBadgeClass = current.status === "now" ? "bg-[#E6F4EA] text-[#1E8E5A]" : current.status === "next" ? "bg-[#EEF2FF] text-[#2D6CDF]" : current.status === "later" ? "bg-[#F2EAFE] text-[#7A4ED9]" : "bg-[#FDECEC] text-[#B91C22]";

  return (
    <article className="mission-detail-workspace mx-auto w-full max-w-[1052px] px-4 py-5 md:px-[26px] md:py-7" aria-busy={isPending}>
      {variant === "full" && current.project ? (
        <Breadcrumb className="mb-5">
          <BreadcrumbList className="flex-nowrap text-carbon/60">
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href={projectHref(current.project)}>{current.project.name}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0"><BreadcrumbPage className="truncate">{current.title}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}
      <div className="mission-detail-layout grid min-w-0 gap-[30px]">
        <main className="min-w-0">
          <header>
            <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
              {(() => { const TypeIcon = missionTypeIcon[current.type]; return <span className={`inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] text-[11.5px] font-bold ${typeBadgeClass}`}><TypeIcon className="size-[13px]" aria-hidden="true" />{missionTypeLabel[current.type]}</span>; })()}
              <span className={`inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] text-xs font-semibold ${statusBadgeClass}`}><span className={`size-[7px] rounded-full bg-current ${current.status === "now" ? "animate-pulse" : ""}`} aria-hidden="true" />{missionStatusLabel[current.status]}</span>
              <span className="ml-0.5 font-mono text-[11.5px] text-[#9A9A98]">{current.displayId}</span>
            </div>
            <div className="flex items-start gap-2.5">
              <IconPicker icons={missionIcons} value={current.icon} color={tone} recentStorageKey="zipform-tloz-recent-icons" onValueChange={saveIcon} iconOnly className={`mt-0.5 size-8 shrink-0 justify-center rounded-lg border-0 p-0 shadow-none [&_svg]:size-[15px] ${iconSurfaceClass}`} />
              {editingTitle ? <Input autoFocus className="h-auto border border-[#1D1D1B]/15 bg-white px-2 py-0 text-[30px] font-bold leading-[1.12] tracking-[-0.025em] shadow-none focus-visible:ring-2 focus-visible:ring-[#1D1D1B]/10" value={titleDraft} aria-label="Título de la misión" onChange={(event) => setTitleDraft(event.target.value)} onBlur={saveTitle} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") { skipTitleSave.current = true; setTitleDraft(current.title); setEditingTitle(false); } }} /> : <button type="button" className="max-w-full rounded-md text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1D1D1B]/20" onClick={() => { skipTitleSave.current = false; setEditingTitle(true); }}><h1 className="m-0 text-balance text-[30px] font-bold leading-[1.12] tracking-[-0.025em] text-[#1D1D1B]">{current.title}</h1></button>}
            </div>
          </header>

          <Accordion type="multiple" defaultValue={defaultMissionContentSections} className="mb-7 mt-3" aria-label="Contenido de la misión">
            <AccordionItem value="description" className="border-0">
              <AccordionTrigger iconPosition="start" className="py-2 text-[13px] uppercase tracking-[0.04em] text-carbon/75">Descripción</AccordionTrigger>
              <AccordionContent className="pt-1">
            {editingDescription ? (
              <textarea
                autoFocus
                className="min-h-28 w-full resize-y rounded-xl border border-[#1D1D1B]/15 bg-white px-3 py-2 text-[15px] leading-[1.6] text-[#454543] outline-none focus:border-[#1D1D1B]/25 focus:ring-2 focus:ring-[#1D1D1B]/10"
                aria-label="Descripción de la misión"
                value={descriptionDraft}
                maxLength={280}
                onChange={(event) => setDescriptionDraft(event.target.value)}
                onBlur={() => { if (skipDescriptionSave.current) { skipDescriptionSave.current = false; setDescriptionDraft(current.description); } else saveDescription(); setEditingDescription(false); }}
                onKeyDown={(event) => { if (event.key === "Escape") { skipDescriptionSave.current = true; setDescriptionDraft(current.description); setEditingDescription(false); } }}
                placeholder="Resumen breve del resultado esperado."
              />
            ) : (
              <button type="button" className="block max-w-[62ch] rounded-md text-left text-[15px] leading-[1.6] text-[#454543] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1D1D1B]/20" onClick={() => { skipDescriptionSave.current = false; setDescriptionDraft(current.description); setEditingDescription(true); }}>{current.description || "Añadir descripción"}</button>
            )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="detail" className="border-0">
              <AccordionTrigger iconPosition="start" className="py-2 text-[13px] uppercase tracking-[0.04em] text-carbon/75">Detalle</AccordionTrigger>
              <AccordionContent className="pt-1">
                <MarkdownEditor value={detailMarkdown} onSave={saveDocument} onToggleTask={toggleChecklistItem} showHeader={false} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="checklist" className="border-0">
              <AccordionTrigger iconPosition="start" className="py-2 text-[13px] uppercase tracking-[0.04em] text-carbon/75">
                <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <span>Checklist</span>
                  <span className="font-mono text-xs font-medium tracking-normal text-[#6B6B6B]">{current.checklist.filter((item) => item.completed).length} / {current.checklist.length}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-1">
                <div className="mb-[13px] flex justify-end">
                  <SegmentedControl aria-label="Filtrar checklist" value={checklistFilter} onValueChange={(value) => setChecklistFilter(value as "all" | "pending")} options={[{ label: "Todos", value: "all" }, { label: "Pendientes", value: "pending" }]} />
                </div>
                <MetricProgress className="mb-[15px]" value={checklistProgress} tone={tone} />
                <div key={checklistFilter} className="mission-checklist-filter rounded-[14px] border border-[#1D1D1B]/10 bg-white p-1.5">
              {current.checklist.map((item, position) => ({ item, position })).filter(({ item }) => checklistFilter === "all" || !item.completed).map(({ item, position }) => (
                <div key={item.id} className="group flex items-center gap-[11px] rounded-[10px] px-3 py-2 transition-colors hover:bg-[#D72228]/[0.04]">
                  <label className="relative grid size-[19px] shrink-0 cursor-pointer place-items-center">
                    <input type="checkbox" className="peer size-[19px] cursor-pointer appearance-none rounded-[7px] border-2 border-[#1D1D1B]/25 bg-white transition-colors checked:border-[#D72228] checked:bg-[#D72228] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D1D1B]/30" checked={item.completed} onChange={(event) => toggleChecklistItem(position, event.target.checked)} />
                    <Check className="pointer-events-none absolute size-3 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden="true" />
                    <span className="sr-only">{item.title}</span>
                  </label>
                  {renamingChecklist === position ? (
                    <Input autoFocus className="h-8 min-w-0 flex-1 text-[13.5px]" value={checklistTitleDraft} aria-label="Nombre del checkbox" onChange={(event) => setChecklistTitleDraft(event.target.value)} onBlur={() => renameChecklistItem(position)} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") setRenamingChecklist(null); }} />
                  ) : <span className={`min-w-0 flex-1 text-[13.5px] ${item.completed ? "text-[#9A9A98] line-through" : "text-[#1D1D1B]"}`}>{item.title}</span>}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon-xs" className="size-7 shrink-0 rounded-md text-carbon/45 opacity-0 transition-opacity hover:text-carbon group-focus-within:opacity-100 group-hover:opacity-100" aria-label={`Acciones para ${item.title}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36"><DropdownMenuItem onSelect={() => { setChecklistTitleDraft(item.title); setRenamingChecklist(position); }}><Pencil className="size-3.5" />Editar</DropdownMenuItem><DropdownMenuItem className="text-zivelo focus:text-zivelo" onSelect={() => setDeletingChecklist(position)}><Trash2 className="size-3.5" />Eliminar</DropdownMenuItem></DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              <AddChecklistTask onAdd={(title) => saveDocument(appendTaskLine(detailMarkdown, title))} />
                </div>
                <AlertDialog open={deletingChecklist !== null} onOpenChange={(open) => !open && setDeletingChecklist(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Eliminar checkbox</AlertDialogTitle><AlertDialogDescription>Esta acción quitará “{deletingChecklist === null ? "" : current.checklist[deletingChecklist]?.title}” del documento de la misión.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deletingChecklist !== null && deleteChecklistItem(deletingChecklist)}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex flex-col gap-7">
            <RelationsSection title="Dependencias">
              <MissionReferences missions={current.dependencies} project={current.project} onRemove={(id) => mutate("Quitando dependencia…", () => removeMissionDependency(current.id, id))} onNavigate={onNavigateMission} />
              <div className="flex flex-col gap-[9px]">{current.questItems.map((item) => <QuestReference key={item.id} item={item} required={current.missionQuestItems.find((link) => link.questItemId === item.id)?.required ?? false} onNavigate={onNavigateQuestItem} onRequiredChange={(checked) => mutate("Actualizando requisito…", () => setMissionQuestItem(current.id, item.id, checked))} onRemove={() => mutate("Quitando item…", () => removeMissionQuestItem(current.id, item.id))} />)}</div>
              <AddDependency
                missions={options.missions.filter((item) => Boolean(current.projectId) && item.projectId === current.projectId && item.id !== current.id && !current.dependencies.some((dependency) => dependency.id === item.id)).map((item) => ({ id: item.id, name: item.title, iconComponent: resolveMissionIcon(item.icon), iconColor: missionTypeTone[item.type], iconBackground: missionTypeBackground[item.type] }))}
                questItems={options.questItems.filter((item) => !current.questItems.some((linked) => linked.id === item.id)).map((item) => ({ id: item.id, name: item.name, iconComponent: resolveMissionIcon(item.icon), iconColor: "#7A5A12", iconBackground: "#FFF4DE" }))}
                onAddMission={(id) => mutate("Agregando dependencia…", () => addMissionDependency(current.id, id))}
                onAddQuestItem={(id) => mutate("Agregando item…", () => setMissionQuestItem(current.id, id, false))}
              />
              {current.requiredBy.length ? <><Separator /><h3 className="m-0 text-xs font-semibold text-carbon/45">Requerida por</h3><MissionReferences missions={current.requiredBy} project={current.project} onNavigate={onNavigateMission} /></> : null}
            </RelationsSection>
          </div>

          <RelationsSection className="mt-7" title="Recursos">
            <div className="mission-resource-grid grid grid-cols-2 gap-2.5">
              {MISSION_ATTACHMENT_UPLOAD_UI_ENABLED ? <MissionAttachmentUploader missionId={current.id} resources={current.resources.filter((resource) => Boolean(resource.groupKey && resource.externalKey))} canUpdate={canUpdate} onGroupCompleted={acceptAttachmentGroup} /> : null}
              <MissionResourceReferences resources={current.resources} onRemove={(resource) => mutate("Quitando recurso…", () => removeMissionResource(current.id, resource.id))} />
              {!current.resources.length ? <EmptyText>Sin recursos adjuntos.</EmptyText> : null}
            </div>
            <AddResource onAdd={(input) => mutate("Adjuntando recurso…", () => addMissionResource(current.id, input))} />
          </RelationsSection>
        </main>

        <aside className="mission-detail-properties flex self-start flex-col gap-3.5" aria-label="Información de la misión">
          {variant === "panel" ? (
            <Link href={fullMissionHref} className="flex items-center justify-center gap-2 rounded-xl border border-carbon/10 bg-white px-4 py-3 text-[13px] font-semibold text-carbon/60 no-underline transition-colors hover:border-carbon/20 hover:text-carbon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M9 8h6" /><path d="M9 12h6" /><path d="M9 16h4" /></svg>
              Abrir en página completa
            </Link>
          ) : null}
          <section className="overflow-hidden rounded-2xl border border-[#1D1D1B]/10 bg-white" aria-labelledby="mission-properties-title"><h2 id="mission-properties-title" className="m-0 border-b border-[#1D1D1B]/[0.07] px-4 py-[13px] text-[11px] font-bold uppercase tracking-[0.05em] text-[#9A9A98]">Propiedades</h2><div className="px-2 py-1.5"><MissionInlineEditor mission={current} options={options} onMissionChange={(updated) => accept({ ...current, ...updated })} /></div></section>
          <section className="overflow-hidden rounded-2xl border border-[#1D1D1B]/10 bg-white" aria-labelledby="mission-activity-title"><h2 id="mission-activity-title" className="m-0 border-b border-[#1D1D1B]/[0.07] px-4 py-[13px] text-[11px] font-bold uppercase tracking-[0.05em] text-[#9A9A98]">Actividad</h2><div className="flex flex-col gap-3 p-4 text-xs text-[#6B6B6B]"><ActivityItem label={`Estado: ${missionStatusLabel[current.status]}`} date={current.updatedAt} tone={missionStatusTone[current.status]} /><ActivityItem label="Misión actualizada" date={current.updatedAt} tone={tone} /><ActivityItem label="Misión creada" date={current.createdAt} /></div></section>
          <Button className="min-h-11 rounded-xl" disabled={current.status === "completed"} onClick={() => startTransition(async () => accept({ ...current, ...(await patchMissionStatus(current.id, "completed")) }))}><Check data-icon="inline-start" aria-hidden="true" />{current.status === "completed" ? "Misión completada" : "Marcar como completada"}</Button>
        </aside>
      </div>
    </article>
  );
}

function AddChecklistTask({ onAdd }: { onAdd: (title: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const cancelled = useRef(false);
  function finish() {
    if (cancelled.current) { cancelled.current = false; setTitle(""); setAdding(false); return; }
    const value = title.trim();
    if (value) onAdd(value);
    setTitle("");
    setAdding(false);
  }
  if (adding) return <Input autoFocus aria-label="Nueva subtarea" placeholder="Nombre de la subtarea" className="my-1 h-9 border-[#1D1D1B]/15 bg-[#FAFAF9] text-[13px]" value={title} onChange={(event) => setTitle(event.target.value)} onBlur={finish} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") { cancelled.current = true; setTitle(""); setAdding(false); } }} />;
  return <button type="button" className="flex w-full items-center gap-[11px] rounded-[10px] px-3 py-2.5 text-left text-[#9A9A98] transition-colors hover:bg-[#D72228]/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1D1D1B]/20" onClick={() => { cancelled.current = false; setAdding(true); }}><Plus className="size-4" aria-hidden="true" /><span className="text-[13px]">Añadir subtarea</span></button>;
}

export function AddDependency({ missions, questItems, onAddMission, onAddQuestItem }: { missions: EntityPickerOption[]; questItems: EntityPickerOption[]; onAddMission: (id: string) => void; onAddQuestItem: (id: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<"mission" | "quest">("mission");
  if (!adding) return <button type="button" className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#1D1D1B]/15 bg-white text-[13px] font-semibold text-[#6B6B6B] transition-colors hover:border-[#D72228]/30 hover:text-[#D72228] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1D1D1B]/20" onClick={() => setAdding(true)}><Plus className="size-3.5" aria-hidden="true" />Agregar nuevo</button>;
  return <div className="rounded-xl border border-[#1D1D1B]/10 bg-white p-3">
    <SegmentedControl aria-label="Tipo de dependencia" value={kind} onValueChange={(value) => setKind(value as "mission" | "quest")} options={[{ label: "Mission", value: "mission" }, { label: "Inventory", value: "quest" }]} />
    <div className="mt-2 flex items-center gap-2"><EntityPicker label={kind === "mission" ? "Mission" : "Inventory item"} options={kind === "mission" ? missions : questItems} allowEmpty={false} onValueChange={(id) => { if (kind === "mission") onAddMission(id); else onAddQuestItem(id); setAdding(false); }} /><Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancelar</Button></div>
  </div>;
}

function RelationsSection({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={`group relative ${className}`}><h2 className="mb-[13px] mt-0 text-[13px] font-bold uppercase tracking-[0.04em] text-carbon/75">{title}</h2><div className="flex flex-col gap-2.5">{children}</div></section>;
}

function QuestReference({ item, required, onNavigate, onRequiredChange, onRemove }: { item: TlozQuestItem; required: boolean; onNavigate?: (id: string) => void; onRequiredChange: (checked: boolean) => void; onRemove: () => void }) {
  const QuestIcon = resolveMissionIcon(item.icon);
  const unlocked = item.status === "unlocked";
  const href = inventoryItemHref(item.id);
  return <div className="group/quest flex min-h-[54px] items-center gap-3 rounded-xl border border-[#1D1D1B]/10 bg-white px-3.5 py-3 transition-colors hover:border-[#D72228]/25">
    {onNavigate ? <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => onNavigate(item.id)}><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#FFF4DE] text-[#7A5A12] [&_svg]:size-3"><QuestIcon aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-semibold text-[#1D1D1B]">{item.name}</span><span className="mt-px block truncate text-[11.5px] text-[#9A9A98]">{item.description || "Inventory item"}</span></span></button> : <Link href={href} className="flex min-w-0 flex-1 items-center gap-3 text-inherit no-underline"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#FFF4DE] text-[#7A5A12] [&_svg]:size-3"><QuestIcon aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-semibold text-[#1D1D1B]">{item.name}</span><span className="mt-px block truncate text-[11.5px] text-[#9A9A98]">{item.description || "Inventory item"}</span></span></Link>}
    <span className={unlocked ? "rounded-full bg-[#E6F4EA] px-[9px] py-1 text-[11px] font-bold text-[#1E6B3C]" : "rounded-full bg-[#FFF4DE] px-[9px] py-1 text-[11px] font-bold text-[#7A5A12]"}>{unlocked ? "Desbloqueado" : "Bloqueado"}</span>
    <OpenReferenceButton label={`Abrir ${item.name}`} href={href} onOpen={onNavigate ? () => onNavigate(item.id) : undefined} className="opacity-0 group-hover/quest:opacity-100 focus:opacity-100" />
    <DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon-xs" className="size-6 rounded-md opacity-0 group-hover/quest:opacity-100 focus:opacity-100 [&_svg]:size-3" aria-label={`Acciones para ${item.name}`}><MoreHorizontal aria-hidden="true" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuGroup>
      {onNavigate ? <DropdownMenuItem onSelect={() => onNavigate(item.id)}><PanelRightOpen aria-hidden="true" />Abrir item</DropdownMenuItem> : <DropdownMenuItem asChild><Link href={href}><PanelRightOpen aria-hidden="true" />Abrir item</Link></DropdownMenuItem>}
      <DropdownMenuCheckboxItem checked={required} onCheckedChange={(checked) => onRequiredChange(Boolean(checked))}>Requerido</DropdownMenuCheckboxItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-[#B91C22] focus:text-[#B91C22]" onSelect={onRemove}><X aria-hidden="true" />Eliminar item</DropdownMenuItem>
    </DropdownMenuGroup></DropdownMenuContent></DropdownMenu>
  </div>;
}

function MissionReferences({ missions, project, onRemove, onNavigate }: { missions: Array<{ id: string; displayId: string; title: string; status: TlozMissionRecord["status"]; icon: string; type: TlozMissionRecord["type"] }>; project?: Pick<TlozProject, "name" | "slug">; onRemove?: (id: string) => void; onNavigate?: (id: string) => void }) {
  if (!missions.length) return null;
  return <div className="flex flex-col gap-[9px]">{missions.map((item) => {
    const Icon = resolveMissionIcon(item.icon); const itemTone = missionTypeTone[item.type]; const href = project ? missionHref(project, item.displayId) : "/tloz";
    const content = <><span className="grid size-7 shrink-0 place-items-center rounded-lg [&_svg]:size-3" style={{ color: itemTone, backgroundColor: missionTypeBackground[item.type] }}><Icon aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-semibold text-[#1D1D1B]">{item.title}</span><span className="mt-px block text-[11.5px] text-[#9A9A98]">Mission · {missionStatusLabel[item.status]}</span></span></>;
    return <div key={item.id} className="group/mission flex min-h-[54px] items-center gap-2 rounded-xl border border-[#1D1D1B]/10 bg-white px-3.5 py-3 transition-colors hover:border-[#D72228]/25">{onNavigate ? <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => onNavigate(item.id)}>{content}</button> : <Link className="flex min-w-0 flex-1 items-center gap-3 text-inherit" href={href}>{content}</Link>}{item.status === "completed" ? <span className="rounded-full bg-[#FDECEC] px-[9px] py-1 text-[11px] font-bold text-[#B91C22]">Completada</span> : null}<OpenReferenceButton label={`Abrir ${item.title}`} href={href} onOpen={onNavigate ? () => onNavigate(item.id) : undefined} className="opacity-0 group-hover/mission:opacity-100 focus:opacity-100" /><DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon-xs" className="size-6 rounded-md opacity-0 group-hover/mission:opacity-100 focus:opacity-100 [&_svg]:size-3" aria-label={`Acciones para ${item.title}`}><MoreHorizontal aria-hidden="true" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuGroup>{onNavigate ? <DropdownMenuItem onSelect={() => onNavigate(item.id)}><PanelRightOpen aria-hidden="true" />Abrir Mission</DropdownMenuItem> : <DropdownMenuItem asChild><Link href={href}><PanelRightOpen aria-hidden="true" />Abrir Mission</Link></DropdownMenuItem>}{onRemove ? <><DropdownMenuSeparator /><DropdownMenuItem className="text-[#B91C22] focus:text-[#B91C22]" onSelect={() => onRemove(item.id)}><X aria-hidden="true" />Eliminar dependencia</DropdownMenuItem></> : null}</DropdownMenuGroup></DropdownMenuContent></DropdownMenu></div>;
  })}</div>;
}

function MissionResourceReferences({ resources, onRemove }: { resources: TlozResource[]; onRemove: (resource: TlozResource) => void }) {
  const grouped = new Map<string, TlozResource[]>();
  const standalone: TlozResource[] = [];
  for (const resource of resources) {
    if (!resource.groupKey) {
      standalone.push(resource);
      continue;
    }
    grouped.set(resource.groupKey, [...(grouped.get(resource.groupKey) ?? []), resource]);
  }
  const previewSlides: ResourcePreviewSlide[] = standalone.flatMap((resource) => {
    const src = resolveResourceImageUrl(resource);
    return src ? [{ id: resource.id, src, alt: resource.title, title: resource.title }] : [];
  });
  return <>{[...grouped.entries()].map(([groupKey, group]) => <MissionAttachmentGroupReference key={groupKey} groupKey={groupKey} resources={group} onRemove={onRemove} />)}{standalone.map((resource) => <ResourceReference key={resource.id} resource={resource} previewSlides={previewSlides} onRemove={() => onRemove(resource)} />)}</>;
}

function MissionAttachmentGroupReference({ groupKey, resources, onRemove }: { groupKey: string; resources: TlozResource[]; onRemove: (resource: TlozResource) => void }) {
  const previewSlides: ResourcePreviewSlide[] = resources.flatMap((resource) => {
    const src = resolveResourceImageUrl(resource);
    return src ? [{ id: resource.id, src, alt: resource.title, title: resource.title }] : [];
  });
  const groupName = groupKey.replace(/[._-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
  return <section className="col-span-full min-w-0 rounded-xl border border-[#1D1D1B]/10 bg-white p-3" aria-labelledby={`resource-group-${groupKey}`}>
    <div className="mb-2.5 flex min-w-0 items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#EEF2FF] text-[#3A47B5] [&_svg]:size-4"><FileStack aria-hidden="true" /></span>
      <div className="min-w-0 flex-1"><h3 id={`resource-group-${groupKey}`} className="m-0 truncate text-[13.5px] font-semibold text-[#1D1D1B]">{groupName}</h3><p className="m-0 text-[11.5px] text-[#9A9A98]">Grupo de capturas · {resources.length} {resources.length === 1 ? "imagen" : "imágenes"}</p></div>
    </div>
    <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">{resources.map((resource) => <ResourceReference key={resource.id} resource={resource} previewSlides={previewSlides} onRemove={() => onRemove(resource)} />)}</div>
  </section>;
}

function ResourceReference({ resource, previewSlides, onRemove }: { resource: TlozResource; previewSlides: ResourcePreviewSlide[]; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isGithub = isGithubUrl(resource.url);
  const previewUrl = resolveResourceImageUrl(resource);
  const isPreviewable = Boolean(previewUrl);
  const ResourceIcon = resolveResourceIcon(resource);
  const content = <><span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#EEF2FF] text-[#3A47B5] [&_svg]:size-3"><ResourceIcon aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="m-0 truncate text-sm font-semibold">{resource.title}</p><p className="m-0 truncate text-xs text-carbon/45">{resourceTypeLabel[resource.type]}{resource.fileId && !previewUrl ? ` · ${resource.fileId}` : ""}</p></div></>;
  const primary = isPreviewable ? <button ref={triggerRef} type="button" className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-carbon/20" onClick={() => setOpen(true)} aria-label={`Previsualizar ${resource.title}`}>{content}</button> : resource.url ? <a className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-carbon/20" href={resource.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${resource.title}`}>{content}</a> : <div className="flex min-w-0 flex-1 items-center gap-3">{content}</div>;
  return <div className="group/resource flex items-center gap-2 rounded-xl border border-carbon/10 bg-white px-3 py-3 transition-colors hover:border-[#D72228]/25">{primary}{isGithub ? <span className="text-xs font-semibold text-carbon/55">GitHub</span> : null}<IconButton className="opacity-0 group-hover/resource:opacity-100 focus:opacity-100" label={`Eliminar ${resource.title}`} onClick={onRemove} />{isPreviewable ? <ResourcePreview slides={previewSlides} open={open} onClose={() => setOpen(false)} index={Math.max(previewSlides.findIndex((slide) => slide.id === resource.id), 0)} triggerRef={triggerRef} /> : null}</div>;
}

function OpenReferenceButton({ label, href, onOpen, className }: { label: string; href: string; onOpen?: () => void; className?: string }) {
  const control = onOpen ? <Button type="button" variant="ghost" size="icon-xs" className={`size-6 rounded-md [&_svg]:size-3 ${className ?? ""}`} aria-label={label} onClick={onOpen}><PanelRightOpen aria-hidden="true" /></Button> : <Button asChild variant="ghost" size="icon-xs" className={`size-6 rounded-md [&_svg]:size-3 ${className ?? ""}`}><Link href={href} aria-label={label}><PanelRightOpen aria-hidden="true" /></Link></Button>;
  return <Tooltip><TooltipTrigger asChild>{control}</TooltipTrigger><TooltipContent>Abrir detalle</TooltipContent></Tooltip>;
}

export function AddResource({ onAdd }: { onAdd: (input: TlozResourceInput) => void }) {
  const [adding, setAdding] = useState(false); const [title, setTitle] = useState(""); const [location, setLocation] = useState(""); const [type, setType] = useState<TlozResourceType>("link"); const [icon, setIcon] = useState("");
  const usesFileId = resourceUsesFileId(type);
  if (!adding) return <button type="button" className="col-span-full flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#1D1D1B]/15 bg-white text-[13px] font-semibold text-[#6B6B6B] transition-colors hover:border-[#D72228]/30 hover:text-[#D72228] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1D1D1B]/20" onClick={() => setAdding(true)}><Plus className="size-3.5" aria-hidden="true" />Agregar nuevo</button>;
  const inferredIcon = inferResourceIconId({ type, url: usesFileId ? undefined : location, icon: icon || undefined });
  return <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-carbon/10 bg-white p-2.5"><div className="grid min-w-0 grid-cols-[40px_minmax(0,1fr)] gap-2 sm:grid-cols-[40px_130px_minmax(0,1fr)]"><IconPicker icons={RESOURCE_ICON_OPTIONS} value={inferredIcon} label="Icono del recurso" onValueChange={setIcon} allowClear iconOnly className="size-10 justify-center" /><Select value={type} onValueChange={(value) => setType(value as TlozResourceType)}><SelectTrigger aria-label="Tipo de recurso"><SelectValue /></SelectTrigger><SelectContent position="item-aligned"><SelectGroup>{Object.entries(resourceTypeLabel).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectGroup></SelectContent></Select><Input className="col-span-2 min-w-0 sm:col-span-1" aria-label="Título del recurso" placeholder="Título" value={title} onChange={(event) => setTitle(event.target.value)} /></div><div className="flex min-w-0 flex-col gap-2 sm:flex-row"><Input className="min-w-0 flex-1" aria-label={usesFileId ? "Identificador del archivo" : "URL del recurso"} placeholder={usesFileId ? "ID del archivo" : "https://…"} value={location} onChange={(event) => setLocation(event.target.value)} /><div className="flex shrink-0 justify-end gap-1"><Button type="button" size="icon" variant="outline" disabled={!title.trim()} aria-label="Adjuntar recurso" onClick={() => { onAdd({ type, title: title.trim(), ...(icon ? { icon } : {}), ...(location.trim() ? usesFileId ? { fileId: location.trim() } : { url: location.trim() } : {}) }); setTitle(""); setLocation(""); setIcon(""); setAdding(false); }}><Plus aria-hidden="true" /></Button><Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button></div></div></div>;
}

function IconButton({ label, onClick, className }: { label: string; onClick: () => void; className?: string }) { return <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon-xs" className={`size-6 rounded-md [&_svg]:size-3 ${className ?? ""}`} aria-label={label} onClick={onClick}><X aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>Eliminar</TooltipContent></Tooltip>; }
function EmptyText({ children }: { children: React.ReactNode }) { return <p className="m-0 text-sm text-carbon/45">{children}</p>; }
function ActivityItem({ label, date, tone = "#9a9a98" }: { label: string; date: string; tone?: string }) { return <div className="flex gap-2.5"><span className="mt-1 size-2 shrink-0 rounded-full" style={{ backgroundColor: tone }} aria-hidden="true" /><span><strong className="block font-semibold text-carbon/75">{label}</strong><time className="font-mono text-[10.5px] text-carbon/40" dateTime={date}>{new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date))}</time></span></div>; }

const missionTypeBackground: Record<TlozMissionRecord["type"], string> = { main_quest: "#FDECEC", side_quest: "#EEF2FF", farming_quest: "#E6F4EA", exploration_quest: "#F2EAFE" };
const missionTypeSurfaceClass: Record<TlozMissionRecord["type"], string> = { main_quest: "bg-[#FDECEC] hover:bg-[#F9DDDE]", side_quest: "bg-[#EEF2FF] hover:bg-[#E1E8FF]", farming_quest: "bg-[#E6F4EA] hover:bg-[#D9EEDF]", exploration_quest: "bg-[#F2EAFE] hover:bg-[#E8DBFA]" };
function snapshotOf(mission: TlozMissionDetail): EditableSnapshot { return { title: mission.title, description: mission.description, descriptionDetail: mission.descriptionDetail, icon: mission.icon }; }
