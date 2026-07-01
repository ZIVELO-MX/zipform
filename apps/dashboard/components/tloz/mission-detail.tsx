"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Database, File, FileCheck, FileText, ImageIcon, KeyRound, LayoutDashboard, Link2, MoreHorizontal, PanelRightOpen, Plus, Search, Shield, Sparkles, Star, StickyNote, Sword, Target, Wrench, X } from "lucide-react";
import { Button, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, EntityPicker, IconPicker, Input, MetricProgress, SegmentedControl, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, Separator, toast, Tooltip, TooltipContent, TooltipTrigger, type EntityPickerOption, type IconPickerOption } from "@zipform/ui";
import type { TlozMissionDetail, TlozMissionRecord } from "../../lib/tloz-data";
import type { TlozQuestItem, TlozResource, TlozResourceType } from "@zipform/types";
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
import { missionStatusLabel, missionTypeLabel, missionTypeTone, resolveMissionIcon } from "./tloz-utils";

const missionIcons: IconPickerOption[] = [
  { id: "Sword", label: "Misión", icon: Sword }, { id: "Sparkles", label: "Destacado", icon: Sparkles }, { id: "LayoutDashboard", label: "Dashboard", icon: LayoutDashboard }, { id: "Search", label: "Búsqueda", icon: Search }, { id: "Database", label: "Base de datos", icon: Database }, { id: "FileText", label: "Documento", icon: FileText }, { id: "FileCheck", label: "Validación", icon: FileCheck }, { id: "KeyRound", label: "Acceso", icon: KeyRound }, { id: "Shield", label: "Seguridad", icon: Shield }, { id: "Wrench", label: "Herramienta", icon: Wrench },
];

export type MissionDetailOptions = Omit<MissionEditorOptions, "missions"> & {
  missions: TlozMissionRecord[];
  questItems: TlozQuestItem[];
};

type EditableSnapshot = Pick<TlozMissionDetail, "title" | "description" | "conclusion" | "icon">;

export function MissionDetail({ mission, options, onMissionChange, onNavigateMission, onNavigateQuestItem }: {
  mission: TlozMissionDetail;
  options: MissionDetailOptions;
  onMissionChange?: (mission: TlozMissionDetail) => void;
  onNavigateMission?: (missionId: string) => void;
  onNavigateQuestItem?: (questItemId: string) => void;
}) {
  const [current, setCurrent] = useState(mission);
  const [markdown, setMarkdown] = useState(mission.description);
  const [descriptionDraft, setDescriptionDraft] = useState(withoutTaskLines(mission.description));
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(mission.title);
  const [editingConclusion, setEditingConclusion] = useState(false);
  const [conclusionDraft, setConclusionDraft] = useState(mission.conclusion ?? "");
  const undoStack = useRef<EditableSnapshot[]>([]);
  const redoStack = useRef<EditableSnapshot[]>([]);
  const skipTitleSave = useRef(false);
  const skipDescriptionSave = useRef(false);
  const skipConclusionSave = useRef(false);
  const [isPending, startTransition] = useTransition();
  const tone = missionTypeTone[current.type];
  const checklistProgress = current.checklist.length ? Math.round((current.checklist.filter((item) => item.completed).length / current.checklist.length) * 100) : 0;

  useEffect(() => { setCurrent(mission); setMarkdown(mission.description); setDescriptionDraft(withoutTaskLines(mission.description)); setTitleDraft(mission.title); setConclusionDraft(mission.conclusion ?? ""); }, [mission]);

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
    if (next.description !== current.description) setMarkdown(next.description);
    setCurrent(next);
    onMissionChange?.(next);
  }

  function mutate(label: string, operation: () => Promise<TlozMissionDetail>) {
    const toastId = toast.loading(label);
    startTransition(async () => {
      try { accept(await operation()); toast.success("Cambios guardados", { id: toastId }); }
      catch { toast.error("No se pudieron guardar los cambios", { id: toastId }); }
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
        await updateMission(current.id, { title: snapshot.title, conclusion: snapshot.conclusion ?? "", icon: snapshot.icon });
        const restored = await saveMissionDocument(current.id, snapshot.description);
        accept(restored);
        setTitleDraft(snapshot.title);
        setConclusionDraft(snapshot.conclusion ?? "");
        toast.success(message);
      } catch { toast.error("No se pudo restaurar el cambio"); }
    });
  }

  function saveIcon(value: string) {
    if (value === current.icon) return;
    remember();
    const toastId = toast.loading("Actualizando icono…");
    startTransition(async () => {
      try { accept({ ...current, ...(await updateMission(current.id, { icon: value })) }); toast.success("Icono actualizado", { id: toastId }); }
      catch { toast.error("No se pudo actualizar el icono", { id: toastId }); }
    });
  }

  function saveTitle() {
    if (skipTitleSave.current) { skipTitleSave.current = false; setTitleDraft(current.title); return; }
    const title = titleDraft.trim();
    setEditingTitle(false);
    if (!title || title === current.title) { setTitleDraft(current.title); return; }
    remember();
    const toastId = toast.loading("Actualizando título…");
    startTransition(async () => {
      try { accept({ ...current, ...(await updateMission(current.id, { title })) }); toast.success("Título actualizado", { id: toastId }); }
      catch { setTitleDraft(current.title); toast.error("No se pudo actualizar el título", { id: toastId }); }
    });
  }

  function saveConclusion() {
    if (skipConclusionSave.current) { skipConclusionSave.current = false; setConclusionDraft(current.conclusion ?? ""); return; }
    const conclusion = conclusionDraft.trim();
    setEditingConclusion(false);
    if (conclusion === (current.conclusion ?? "")) return;
    remember();
    const toastId = toast.loading("Actualizando resultado…");
    startTransition(async () => {
      try { accept({ ...current, ...(await updateMission(current.id, { conclusion })) }); toast.success("Resultado actualizado", { id: toastId }); }
      catch { setConclusionDraft(current.conclusion ?? ""); toast.error("No se pudo actualizar el resultado", { id: toastId }); }
    });
  }

  function saveDocument(nextMarkdown = markdown) {
    if (nextMarkdown === current.description) return;
    remember();
    setMarkdown(nextMarkdown);
    mutate("Guardando documento…", () => saveMissionDocument(current.id, nextMarkdown));
  }

  function saveDescription() {
    saveDocument(withChecklist(descriptionDraft, current.checklist));
  }

  function toggleChecklistItem(position: number, checked: boolean) {
    const nextChecklist = current.checklist.map((item, index) => index === position ? { ...item, completed: checked } : item);
    setCurrent((value) => ({ ...value, checklist: nextChecklist }));
    saveDocument(withChecklist(markdown, nextChecklist));
  }

  const readableMarkdown = markdown.split(/\r?\n/).filter((line) => !/^\s*[-*+]\s+\[[ xX]\]\s+/.test(line)).join("\n").trim();
  const typeBadgeClass = current.type === "main_quest" ? "bg-[#FDECEC] text-[#B91C22]" : current.type === "side_quest" ? "bg-[#EEF2FF] text-[#2D6CDF]" : current.type === "farming_quest" ? "bg-[#E6F4EA] text-[#1E6B3C]" : "bg-[#F2EAFE] text-[#7A4ED9]";
  const iconSurfaceClass = missionTypeSurfaceClass[current.type];
  const statusBadgeClass = current.status === "now" ? "bg-[#E6F4EA] text-[#1E8E5A]" : current.status === "next" ? "bg-[#EEF2FF] text-[#2D6CDF]" : current.status === "later" ? "bg-[#F2EAFE] text-[#7A4ED9]" : current.status === "blocked" ? "bg-[#FDECEC] text-[#B91C22]" : "bg-[#F0EFED] text-[#6B6B6B]";

  return (
    <article className="mission-detail-workspace mx-auto w-full max-w-[1052px] px-[26px] py-7" aria-busy={isPending}>
      <div className="mission-detail-layout grid min-w-0 gap-[30px]">
        <main className="min-w-0">
          <header>
            <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] text-[11.5px] font-bold ${typeBadgeClass}`}><Star className="size-[13px] fill-current" aria-hidden="true" />{missionTypeLabel[current.type]}</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] text-xs font-semibold ${statusBadgeClass}`}><span className={`size-[7px] rounded-full bg-current ${current.status === "now" ? "animate-pulse" : ""}`} aria-hidden="true" />{missionStatusLabel[current.status]}</span>
              <span className="ml-0.5 font-mono text-[11.5px] text-[#9A9A98]">{current.displayId}</span>
            </div>
            <div className="flex items-start gap-2.5">
              <IconPicker icons={missionIcons} value={current.icon} color={tone} recentStorageKey="zipform-tloz-recent-icons" onValueChange={saveIcon} iconOnly className={`mt-0.5 size-8 shrink-0 justify-center rounded-lg border-0 p-0 shadow-none [&_svg]:size-[15px] ${iconSurfaceClass}`} />
              {editingTitle ? <Input autoFocus className="h-auto border border-[#1D1D1B]/15 bg-white px-2 py-0 text-[30px] font-bold leading-[1.12] tracking-[-0.025em] shadow-none focus-visible:ring-2 focus-visible:ring-[#1D1D1B]/10" value={titleDraft} aria-label="Título de la misión" onChange={(event) => setTitleDraft(event.target.value)} onBlur={saveTitle} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") { skipTitleSave.current = true; setTitleDraft(current.title); setEditingTitle(false); } }} /> : <button type="button" className="max-w-full rounded-md text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1D1D1B]/20" onClick={() => { skipTitleSave.current = false; setEditingTitle(true); }}><h1 className="m-0 text-balance text-[30px] font-bold leading-[1.12] tracking-[-0.025em] text-[#1D1D1B]">{current.title}</h1></button>}
            </div>
          </header>

          <section className="mb-7 mt-3" aria-label="Descripción">
            {editingDescription ? (
              <textarea
                autoFocus
                className="min-h-28 w-full resize-y rounded-xl border border-[#1D1D1B]/15 bg-white px-3 py-2 text-[15px] leading-[1.6] text-[#454543] outline-none focus:border-[#1D1D1B]/25 focus:ring-2 focus:ring-[#1D1D1B]/10"
                aria-label="Descripción de la misión"
                value={descriptionDraft}
                onChange={(event) => setDescriptionDraft(event.target.value)}
                onBlur={() => { if (skipDescriptionSave.current) { skipDescriptionSave.current = false; setDescriptionDraft(withoutTaskLines(current.description)); } else saveDescription(); setEditingDescription(false); }}
                onKeyDown={(event) => { if (event.key === "Escape") { skipDescriptionSave.current = true; setDescriptionDraft(withoutTaskLines(current.description)); setEditingDescription(false); } }}
                placeholder="Describe el objetivo y contexto de la misión."
              />
            ) : (
              <button type="button" className="block max-w-[62ch] rounded-md text-left text-[15px] leading-[1.6] text-[#454543] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1D1D1B]/20" onClick={() => { skipDescriptionSave.current = false; setDescriptionDraft(readableMarkdown); setEditingDescription(true); }}>{readableMarkdown || "Añadir descripción"}</button>
            )}
          </section>

          <section className="mb-7" aria-labelledby="mission-conclusion-title"><div className="mb-[13px]"><h2 id="mission-conclusion-title" className="m-0 text-[13px] font-bold uppercase tracking-[0.04em] text-[#454543]">Definición de resultado</h2></div>{editingConclusion ? <textarea autoFocus className="min-h-24 w-full resize-y rounded-[14px] border border-[#1D1D1B]/15 bg-white px-[17px] py-[15px] text-sm leading-[1.55] text-[#454543] outline-none focus:border-[#1D1D1B]/25 focus:ring-2 focus:ring-[#1D1D1B]/10" value={conclusionDraft} onChange={(event) => setConclusionDraft(event.target.value)} onBlur={saveConclusion} onKeyDown={(event) => { if (event.key === "Escape") { skipConclusionSave.current = true; setConclusionDraft(current.conclusion ?? ""); setEditingConclusion(false); } }} /> : <button type="button" className="flex w-full gap-[11px] rounded-[14px] border border-[#1D1D1B]/10 bg-white px-[17px] py-[15px] text-left text-sm leading-[1.55] text-[#454543] transition-colors hover:border-[#1D1D1B]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1D1D1B]/20" onClick={() => { skipConclusionSave.current = false; setEditingConclusion(true); }}><Target className="mt-px size-[18px] shrink-0" style={{ color: tone }} aria-hidden="true" /><span>{current.conclusion || "Definir el resultado esperado de esta misión"}</span></button>}</section>

          <section className="mb-7" aria-labelledby="mission-checklist-title"><div className="mb-[13px] flex items-center justify-between"><h2 id="mission-checklist-title" className="m-0 text-[13px] font-bold uppercase tracking-[0.04em] text-[#454543]">Checklist</h2><span className="font-mono text-xs font-medium text-[#6B6B6B]">{current.checklist.filter((item) => item.completed).length} / {current.checklist.length}</span></div><MetricProgress className="mb-[15px]" value={checklistProgress} tone={tone} /><div className="rounded-[14px] border border-[#1D1D1B]/10 bg-white p-1.5">{current.checklist.map((item, position) => <label key={item.id} className="flex cursor-pointer items-center gap-[11px] rounded-[10px] px-3 py-2.5 transition-colors hover:bg-[#D72228]/[0.04]"><span className="relative grid size-[19px] shrink-0 place-items-center"><input type="checkbox" className="peer size-[19px] cursor-pointer appearance-none rounded-[7px] border-2 border-[#1D1D1B]/25 bg-white transition-colors checked:border-[#D72228] checked:bg-[#D72228] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D1D1B]/30" checked={item.completed} onChange={(event) => toggleChecklistItem(position, event.target.checked)} /><Check className="pointer-events-none absolute size-3 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden="true" /></span><span className={item.completed ? "text-[13.5px] text-[#9A9A98] line-through" : "text-[13.5px] text-[#1D1D1B]"}>{item.title}</span></label>)}<AddChecklistTask onAdd={(title) => saveDocument(withChecklist(markdown, [...current.checklist, { title, completed: false }]))} /></div></section>

          <div className="flex flex-col gap-7">
            <RelationsSection title="Dependencias">
              <MissionReferences missions={current.dependencies} onRemove={(id) => mutate("Quitando dependencia…", () => removeMissionDependency(current.id, id))} onNavigate={onNavigateMission} />
              <div className="flex flex-col gap-[9px]">{current.questItems.map((item) => <QuestReference key={item.id} item={item} required={current.missionQuestItems.find((link) => link.questItemId === item.id)?.required ?? false} onNavigate={onNavigateQuestItem} onRequiredChange={(checked) => mutate("Actualizando requisito…", () => setMissionQuestItem(current.id, item.id, checked))} onRemove={() => mutate("Quitando Quest Item…", () => removeMissionQuestItem(current.id, item.id))} />)}</div>
              <AddDependency
                missions={options.missions.filter((item) => item.id !== current.id && !current.dependencies.some((dependency) => dependency.id === item.id)).map((item) => ({ id: item.id, name: item.title, iconComponent: resolveMissionIcon(item.icon), iconColor: missionTypeTone[item.type], iconBackground: missionTypeBackground[item.type] }))}
                questItems={options.questItems.filter((item) => !current.questItems.some((linked) => linked.id === item.id)).map((item) => ({ id: item.id, name: item.name, iconComponent: resolveMissionIcon(item.icon), iconColor: "#7A5A12", iconBackground: "#FFF4DE" }))}
                onAddMission={(id) => mutate("Agregando dependencia…", () => addMissionDependency(current.id, id))}
                onAddQuestItem={(id) => mutate("Agregando Quest Item…", () => setMissionQuestItem(current.id, id, false))}
              />
              {current.requiredBy.length ? <><Separator /><h3 className="m-0 text-xs font-semibold text-carbon/45">Requerida por</h3><MissionReferences missions={current.requiredBy} onNavigate={onNavigateMission} /></> : null}
            </RelationsSection>
          </div>

          <RelationsSection className="mt-7" title="Recursos">
            <div className="mission-resource-grid grid grid-cols-2 gap-2.5">
              {current.resources.map((resource) => <ResourceReference key={resource.id} resource={resource} onRemove={() => mutate("Quitando recurso…", () => removeMissionResource(current.id, resource.id))} />)}
              {!current.resources.length ? <EmptyText>Sin recursos adjuntos.</EmptyText> : null}
            </div>
            <AddResource onAdd={(input) => mutate("Adjuntando recurso…", () => addMissionResource(current.id, input))} />
          </RelationsSection>
        </main>

        <aside className="mission-detail-properties flex self-start flex-col gap-3.5" aria-label="Información de la misión">
          <section className="overflow-hidden rounded-2xl border border-[#1D1D1B]/10 bg-white" aria-labelledby="mission-properties-title"><h2 id="mission-properties-title" className="m-0 border-b border-[#1D1D1B]/[0.07] px-4 py-[13px] text-[11px] font-bold uppercase tracking-[0.05em] text-[#9A9A98]">Propiedades</h2><div className="px-2 py-1.5"><MissionInlineEditor mission={current} options={options} onMissionChange={(updated) => accept({ ...current, ...updated })} /></div></section>
          <section className="overflow-hidden rounded-2xl border border-[#1D1D1B]/10 bg-white" aria-labelledby="mission-activity-title"><h2 id="mission-activity-title" className="m-0 border-b border-[#1D1D1B]/[0.07] px-4 py-[13px] text-[11px] font-bold uppercase tracking-[0.05em] text-[#9A9A98]">Actividad</h2><div className="flex flex-col gap-3 p-4 text-xs text-[#6B6B6B]"><ActivityItem label={`Estado: ${missionStatusLabel[current.status]}`} date={current.updatedAt} tone={tone} /><ActivityItem label="Misión actualizada" date={current.updatedAt} tone={tone} /><ActivityItem label="Misión creada" date={current.createdAt} /></div></section>
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

function AddDependency({ missions, questItems, onAddMission, onAddQuestItem }: { missions: EntityPickerOption[]; questItems: EntityPickerOption[]; onAddMission: (id: string) => void; onAddQuestItem: (id: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<"mission" | "quest">("mission");
  if (!adding) return <button type="button" className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#1D1D1B]/15 bg-white text-[13px] font-semibold text-[#6B6B6B] transition-colors hover:border-[#D72228]/30 hover:text-[#D72228] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1D1D1B]/20" onClick={() => setAdding(true)}><Plus className="size-3.5" aria-hidden="true" />Agregar nuevo</button>;
  return <div className="rounded-xl border border-[#1D1D1B]/10 bg-white p-3">
    <SegmentedControl aria-label="Tipo de dependencia" value={kind} onValueChange={(value) => setKind(value as "mission" | "quest")} options={[{ label: "Mission", value: "mission" }, { label: "Quest Item", value: "quest" }]} />
    <div className="mt-2 flex items-center gap-2"><EntityPicker label={kind === "mission" ? "Mission" : "Quest Item"} options={kind === "mission" ? missions : questItems} allowEmpty={false} onValueChange={(id) => { if (kind === "mission") onAddMission(id); else onAddQuestItem(id); setAdding(false); }} /><Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancelar</Button></div>
  </div>;
}

function RelationsSection({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={`group relative ${className}`}><h2 className="mb-[13px] mt-0 text-[13px] font-bold uppercase tracking-[0.04em] text-carbon/75">{title}</h2><div className="flex flex-col gap-2.5">{children}</div></section>;
}

function QuestReference({ item, required, onNavigate, onRequiredChange, onRemove }: { item: TlozQuestItem; required: boolean; onNavigate?: (id: string) => void; onRequiredChange: (checked: boolean) => void; onRemove: () => void }) {
  const QuestIcon = resolveMissionIcon(item.icon);
  const unlocked = item.status === "completed";
  return <div className="group/quest flex min-h-[54px] items-center gap-3 rounded-xl border border-[#1D1D1B]/10 bg-white px-3.5 py-3 transition-colors hover:border-[#D72228]/25">
    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#FFF4DE] text-[#7A5A12] [&_svg]:size-3"><QuestIcon aria-hidden="true" /></span>
    <div className="min-w-0 flex-1"><p className="m-0 truncate text-[13.5px] font-semibold text-[#1D1D1B]">{item.name}</p><p className="m-0 mt-px truncate text-[11.5px] text-[#9A9A98]">{item.description || "Quest Item"}</p></div>
    <span className={unlocked ? "rounded-full bg-[#E6F4EA] px-[9px] py-1 text-[11px] font-bold text-[#1E6B3C]" : "rounded-full bg-[#FFF4DE] px-[9px] py-1 text-[11px] font-bold text-[#7A5A12]"}>{unlocked ? "Desbloqueado" : "Bloqueado"}</span>
    <OpenReferenceButton label={`Abrir ${item.name}`} href={`/tloz?questItem=${item.id}#quest-items`} onOpen={onNavigate ? () => onNavigate(item.id) : undefined} className="opacity-0 group-hover/quest:opacity-100 focus:opacity-100" />
    <DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon-xs" className="size-6 rounded-md opacity-0 group-hover/quest:opacity-100 focus:opacity-100 [&_svg]:size-3" aria-label={`Acciones para ${item.name}`}><MoreHorizontal aria-hidden="true" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuGroup>
      {onNavigate ? <DropdownMenuItem onSelect={() => onNavigate(item.id)}><PanelRightOpen aria-hidden="true" />Abrir Quest Item</DropdownMenuItem> : <DropdownMenuItem asChild><Link href={`/tloz?questItem=${item.id}#quest-items`}><PanelRightOpen aria-hidden="true" />Abrir Quest Item</Link></DropdownMenuItem>}
      <DropdownMenuCheckboxItem checked={required} onCheckedChange={(checked) => onRequiredChange(Boolean(checked))}>Requerido</DropdownMenuCheckboxItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-[#B91C22] focus:text-[#B91C22]" onSelect={onRemove}><X aria-hidden="true" />Eliminar Quest Item</DropdownMenuItem>
    </DropdownMenuGroup></DropdownMenuContent></DropdownMenu>
  </div>;
}

function MissionReferences({ missions, onRemove, onNavigate }: { missions: Array<{ id: string; title: string; status: TlozMissionRecord["status"]; icon: string; type: TlozMissionRecord["type"] }>; onRemove?: (id: string) => void; onNavigate?: (id: string) => void }) {
  if (!missions.length) return null;
  return <div className="flex flex-col gap-[9px]">{missions.map((item) => { const Icon = resolveMissionIcon(item.icon); const itemTone = missionTypeTone[item.type]; const content = <><span className="grid size-7 shrink-0 place-items-center rounded-lg [&_svg]:size-3" style={{ color: itemTone, backgroundColor: missionTypeBackground[item.type] }}><Icon aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-semibold text-[#1D1D1B]">{item.title}</span><span className="mt-px block text-[11.5px] text-[#9A9A98]">Mission · {missionStatusLabel[item.status]}</span></span></>; return <div key={item.id} className="group/mission flex min-h-[54px] items-center gap-2 rounded-xl border border-[#1D1D1B]/10 bg-white px-3.5 py-3 transition-colors hover:border-[#D72228]/25">{onNavigate ? <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => onNavigate(item.id)}>{content}</button> : <Link className="flex min-w-0 flex-1 items-center gap-3 text-inherit" href={`/tloz/missions/${item.id}`}>{content}</Link>}{item.status === "completed" ? <span className="rounded-full bg-[#E6F4EA] px-[9px] py-1 text-[11px] font-bold text-[#1E6B3C]">Completada</span> : null}<OpenReferenceButton label={`Abrir ${item.title}`} href={`/tloz/missions/${item.id}`} onOpen={onNavigate ? () => onNavigate(item.id) : undefined} className="opacity-0 group-hover/mission:opacity-100 focus:opacity-100" /><DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon-xs" className="size-6 rounded-md opacity-0 group-hover/mission:opacity-100 focus:opacity-100 [&_svg]:size-3" aria-label={`Acciones para ${item.title}`}><MoreHorizontal aria-hidden="true" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuGroup>{onNavigate ? <DropdownMenuItem onSelect={() => onNavigate(item.id)}><PanelRightOpen aria-hidden="true" />Abrir Mission</DropdownMenuItem> : <DropdownMenuItem asChild><Link href={`/tloz/missions/${item.id}`}><PanelRightOpen aria-hidden="true" />Abrir Mission</Link></DropdownMenuItem>}{onRemove ? <><DropdownMenuSeparator /><DropdownMenuItem className="text-[#B91C22] focus:text-[#B91C22]" onSelect={() => onRemove(item.id)}><X aria-hidden="true" />Eliminar dependencia</DropdownMenuItem></> : null}</DropdownMenuGroup></DropdownMenuContent></DropdownMenu></div>; })}</div>;
}

function ResourceReference({ resource, onRemove }: { resource: TlozResource; onRemove: () => void }) {
  const ResourceIcon = resourceIcon[resource.type];
  const content = <><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#EEF2FF] text-[#3A47B5] [&_svg]:size-3"><ResourceIcon aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="m-0 truncate text-sm font-semibold">{resource.title}</p><p className="m-0 truncate text-xs text-carbon/45">{resourceTypeLabel[resource.type]}{resource.fileId ? ` · ${resource.fileId}` : ""}</p></div></>;
  return <div className="group/resource flex items-center gap-2 rounded-xl border border-carbon/10 bg-white px-3 py-3 transition-colors hover:border-[#D72228]/25">{resource.url ? <a className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-carbon/20" href={resource.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${resource.title}`}>{content}</a> : <div className="flex min-w-0 flex-1 items-center gap-3">{content}</div>}<IconButton className="opacity-0 group-hover/resource:opacity-100 focus:opacity-100" label={`Eliminar ${resource.title}`} onClick={onRemove} /></div>;
}

function OpenReferenceButton({ label, href, onOpen, className }: { label: string; href: string; onOpen?: () => void; className?: string }) {
  const control = onOpen ? <Button type="button" variant="ghost" size="icon-xs" className={`size-6 rounded-md [&_svg]:size-3 ${className ?? ""}`} aria-label={label} onClick={onOpen}><PanelRightOpen aria-hidden="true" /></Button> : <Button asChild variant="ghost" size="icon-xs" className={`size-6 rounded-md [&_svg]:size-3 ${className ?? ""}`}><Link href={href} aria-label={label}><PanelRightOpen aria-hidden="true" /></Link></Button>;
  return <Tooltip><TooltipTrigger asChild>{control}</TooltipTrigger><TooltipContent>Abrir detalle</TooltipContent></Tooltip>;
}

function AddResource({ onAdd }: { onAdd: (input: { type: TlozResourceType; title: string; url?: string; fileId?: string }) => void }) {
  const [adding, setAdding] = useState(false); const [title, setTitle] = useState(""); const [location, setLocation] = useState(""); const [type, setType] = useState<TlozResourceType>("link");
  const usesFileId = type === "file" || type === "document" || type === "image";
  if (!adding) return <button type="button" className="col-span-full flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#1D1D1B]/15 bg-white text-[13px] font-semibold text-[#6B6B6B] transition-colors hover:border-[#D72228]/30 hover:text-[#D72228] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1D1D1B]/20" onClick={() => setAdding(true)}><Plus className="size-3.5" aria-hidden="true" />Agregar nuevo</button>;
  return <div className="grid gap-2 sm:grid-cols-[140px_1fr_1fr_auto_auto]"><Select value={type} onValueChange={(value) => setType(value as TlozResourceType)}><SelectTrigger aria-label="Tipo de recurso"><SelectValue /></SelectTrigger><SelectContent position="item-aligned"><SelectGroup><SelectItem value="link">Enlace</SelectItem><SelectItem value="document">Documento</SelectItem><SelectItem value="file">Archivo</SelectItem><SelectItem value="image">Imagen</SelectItem><SelectItem value="note">Nota</SelectItem></SelectGroup></SelectContent></Select><Input aria-label="Título del recurso" placeholder="Título" value={title} onChange={(event) => setTitle(event.target.value)} /><Input aria-label={usesFileId ? "Identificador del archivo" : "URL del recurso"} placeholder={usesFileId ? "ID del archivo" : "https://…"} value={location} onChange={(event) => setLocation(event.target.value)} /><Button size="icon" variant="outline" disabled={!title.trim()} aria-label="Adjuntar recurso" onClick={() => { onAdd({ type, title: title.trim(), ...(location.trim() ? usesFileId ? { fileId: location.trim() } : { url: location.trim() } : {}) }); setTitle(""); setLocation(""); setAdding(false); }}><Plus aria-hidden="true" /></Button><Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button></div>;
}

function IconButton({ label, onClick, className }: { label: string; onClick: () => void; className?: string }) { return <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon-xs" className={`size-6 rounded-md [&_svg]:size-3 ${className ?? ""}`} aria-label={label} onClick={onClick}><X aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>Eliminar</TooltipContent></Tooltip>; }
function EmptyText({ children }: { children: React.ReactNode }) { return <p className="m-0 text-sm text-carbon/45">{children}</p>; }
function ActivityItem({ label, date, tone = "#9a9a98" }: { label: string; date: string; tone?: string }) { return <div className="flex gap-2.5"><span className="mt-1 size-2 shrink-0 rounded-full" style={{ backgroundColor: tone }} aria-hidden="true" /><span><strong className="block font-semibold text-carbon/75">{label}</strong><time className="font-mono text-[10.5px] text-carbon/40" dateTime={date}>{new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date))}</time></span></div>; }

const resourceTypeLabel: Record<TlozResourceType, string> = { link: "Enlace", document: "Documento", image: "Imagen", file: "Archivo", note: "Nota" };
const resourceIcon: Record<TlozResourceType, React.ElementType> = { link: Link2, document: FileText, image: ImageIcon, file: File, note: StickyNote };
const missionTypeBackground: Record<TlozMissionRecord["type"], string> = { main_quest: "#FDECEC", side_quest: "#EEF2FF", farming_quest: "#E6F4EA", exploration_quest: "#F2EAFE" };
const missionTypeSurfaceClass: Record<TlozMissionRecord["type"], string> = { main_quest: "bg-[#FDECEC] hover:bg-[#F9DDDE]", side_quest: "bg-[#EEF2FF] hover:bg-[#E1E8FF]", farming_quest: "bg-[#E6F4EA] hover:bg-[#D9EEDF]", exploration_quest: "bg-[#F2EAFE] hover:bg-[#E8DBFA]" };
function snapshotOf(mission: TlozMissionDetail): EditableSnapshot { return { title: mission.title, description: mission.description, conclusion: mission.conclusion, icon: mission.icon }; }
function withoutTaskLines(markdown: string) { return markdown.split(/\r?\n/).filter((line) => !/^\s*[-*+]\s+\[[ xX]\]\s+/.test(line)).join("\n").trim(); }
function withChecklist(markdown: string, checklist: Array<{ title: string; completed: boolean }>) { return [withoutTaskLines(markdown), checklist.map((item) => `- [${item.completed ? "x" : " "}] ${item.title}`).join("\n")].filter(Boolean).join("\n"); }
