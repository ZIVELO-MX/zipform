"use client";

import { useState } from "react";
import type { TlozProject, TlozQuestItem, TlozResource, UserProfile } from "@zipform/types";
import { resolveMissionIcon } from "./tloz-utils";
import { useTlozViewState } from "./tloz-view-state";
import type { TlozMissionRecord } from "../../lib/tloz-data";
import { EntityList, EntityTable, type EntityColumn } from "./entity-views";
import { SystemEntitySlideOver } from "./system-project-detail";
import { MissionSlideOver } from "./mission-slide-over";

const projectStatus = { planned: "Planeado", active: "Activo", archived: "Archivado" } as const;
const inventoryStatus = { locked: "Bloqueado", unlocked: "Desbloqueado" } as const;
const categoryLabel = { tool: "Herramienta", access: "Acceso", asset: "Activo", document: "Documento", other: "Otro" } as const;

function Badge({ label, tone }: { label: string; tone: string }) { return <span className="inline-block rounded-full px-[9px] py-[3px] text-[11px] font-bold" style={{ background: `${tone}18`, color: tone }}>{label}</span>; }

export function InventoryProjectView({ items: initialItems, missions, users, resources }: { items: TlozQuestItem[]; missions: TlozMissionRecord[]; users: UserProfile[]; resources: TlozResource[] }) {
  const { state } = useTlozViewState();
  const [items, setItems] = useState(initialItems);
  const [selected, setSelected] = useState<TlozQuestItem | null>(null);
  const [selectedMission, setSelectedMission] = useState<TlozMissionRecord | null>(null);
  const update = (next: TlozProject | TlozQuestItem) => { const item = next as TlozQuestItem; setItems((current) => current.map((value) => value.id === item.id ? item : value)); setSelected(item); };
  const columns: EntityColumn<TlozQuestItem>[] = [
    { id: "name", label: "Inventory item", render: (item) => <Name entity={item} /> },
    { id: "status", label: "Estado", render: (item) => <Badge label={inventoryStatus[item.status]} tone={item.status === "unlocked" ? "#1E6B3C" : "#7A5A12"} /> },
    { id: "category", label: "Categoría", render: (item) => <span className="text-xs text-carbon/65">{categoryLabel[item.category]}</span> },
    { id: "acquired", label: "Adquirido", align: "right", render: (item) => <span className="font-mono text-[11.5px] text-carbon/50">{item.acquiredAt ?? "—"}</span> },
  ];
  return <><div className="tloz-scrl overflow-auto px-[26px] pb-[26px]">{state.view === "list" ? <EntityList title="Inventory" tone="#7A5A12" items={items} onSelect={setSelected} render={(item) => <><Name entity={item} /><span className="ml-auto"><Badge label={inventoryStatus[item.status]} tone={item.status === "unlocked" ? "#1E6B3C" : "#7A5A12"} /></span></>} /> : <EntityTable items={items} columns={columns} onSelect={setSelected} />}</div><SystemEntitySlideOver detail={selected ? { variant: "inventory", entity: selected } : null} onClose={() => setSelected(null)} onChange={update} users={users} missions={missions} resources={selected ? resources.filter((resource) => resource.questItemId === selected.id) : []} onNavigateMission={(mission) => { setSelected(null); setSelectedMission(mission); }} /><MissionSlideOver mission={selectedMission} onClose={() => setSelectedMission(null)} /></>;
}

export function ProjectsSystemView({ projects: initialProjects, missions, users, resources }: { projects: TlozProject[]; missions: TlozMissionRecord[]; users: UserProfile[]; resources: TlozResource[] }) {
  const { state } = useTlozViewState();
  const [projects, setProjects] = useState(initialProjects);
  const [selected, setSelected] = useState<TlozProject | null>(null);
  const [selectedMission, setSelectedMission] = useState<TlozMissionRecord | null>(null);
  const update = (next: TlozProject | TlozQuestItem) => { const project = next as TlozProject; setProjects((current) => current.map((value) => value.id === project.id ? project : value)); setSelected(project); };
  const columns: EntityColumn<TlozProject>[] = [
    { id: "name", label: "Project", render: (project) => <Name entity={project} /> },
    { id: "status", label: "Estado", render: (project) => <Badge label={projectStatus[project.status]} tone={project.color} /> },
    { id: "type", label: "Tipo", render: (project) => <span className="text-xs capitalize text-carbon/65">{project.type === "system" ? "Sistema" : "Normal"}</span> },
    { id: "missions", label: "Missions", render: (project) => <span className="font-mono text-[12px] text-carbon/55">{missions.filter((mission) => mission.projectId === project.id).length}</span> },
    { id: "due", label: "Vence", align: "right", render: (project) => <span className="font-mono text-[11.5px] text-carbon/50">{project.dueDate ?? "—"}</span> },
  ];
  return <><div className="tloz-scrl overflow-auto px-[26px] pb-[26px]">{state.view === "list" ? <EntityList title="Projects" tone="#3A47B5" items={projects} onSelect={setSelected} render={(project) => <><Name entity={project} /><span className="ml-auto"><Badge label={projectStatus[project.status]} tone={project.color} /></span></>} /> : <EntityTable items={projects} columns={columns} onSelect={setSelected} />}</div><SystemEntitySlideOver detail={selected ? { variant: "project", entity: selected } : null} onClose={() => setSelected(null)} onChange={update} users={users} missions={missions} resources={selected ? resources.filter((resource) => resource.projectId === selected.id) : []} onNavigateMission={(mission) => { setSelected(null); setSelectedMission(mission); }} /><MissionSlideOver mission={selectedMission} onClose={() => setSelectedMission(null)} /></>;
}

function Name({ entity }: { entity: TlozProject | TlozQuestItem }) { const Icon = resolveMissionIcon(entity.icon); const tone = "color" in entity ? entity.color : "#7A5A12"; return <span className="flex min-w-0 flex-1 items-center gap-2.5 font-semibold text-carbon"><span className="grid size-7 shrink-0 place-items-center rounded-lg [&_svg]:size-3.5" style={{ background: `${tone}18`, color: tone }}><Icon aria-hidden="true" /></span><span className="truncate">{entity.name}</span></span>; }
