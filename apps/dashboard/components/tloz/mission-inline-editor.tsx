"use client";

import { Database, FileCheck, FileText, KeyRound, LayoutDashboard, Search, Shield, Sparkles, Sword, Wrench, Check, Pencil, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { DatePicker, IconPicker, toast, UserPicker, type IconPickerOption } from "@zipform/ui";
import type { TlozMissionRecord } from "../../lib/tloz-data";
import type { TlozMissionStatus, TlozMissionType } from "@zipform/types";
import { patchMissionStatus, updateMission } from "../../app/tloz/actions";
import { missionTypeTone } from "./tloz-utils";

export type MissionEditorOptions = {
  projects: Array<{ id: string; name: string }>;
  episodes: Array<{ id: string; name: string }>;
  users: Array<{ id: string; name: string; username?: string; avatarUrl?: string }>;
};

const missionIcons: IconPickerOption[] = [
  { id: "Sword", label: "Misión", icon: Sword },
  { id: "Sparkles", label: "Destacado", icon: Sparkles },
  { id: "LayoutDashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "Search", label: "Búsqueda", icon: Search },
  { id: "Database", label: "Base de datos", icon: Database },
  { id: "FileText", label: "Documento", icon: FileText },
  { id: "FileCheck", label: "Validación", icon: FileCheck },
  { id: "KeyRound", label: "Acceso", icon: KeyRound },
  { id: "Shield", label: "Seguridad", icon: Shield },
  { id: "Wrench", label: "Herramienta", icon: Wrench },
];

type MissionInlineEditorProps = {
  mission: TlozMissionRecord;
  options?: MissionEditorOptions;
  onMissionChange?: (mission: TlozMissionRecord) => void;
};

const statuses: Array<{ value: TlozMissionStatus; label: string }> = [
  { value: "now", label: "Now" },
  { value: "next", label: "Next" },
  { value: "later", label: "Later" },
  { value: "blocked", label: "Blocked" },
  { value: "completed", label: "Completed" },
];

const missionTypes: Array<{ value: TlozMissionType; label: string }> = [
  { value: "main_quest", label: "Main Quest" },
  { value: "side_quest", label: "Side Quest" },
  { value: "farming_quest", label: "Farming Quest" },
  { value: "exploration_quest", label: "Exploration Quest" },
];

export function MissionInlineEditor({ mission, options, onMissionChange }: MissionInlineEditorProps) {
  const [currentMission, setCurrentMission] = useState(mission);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => setCurrentMission(mission), [mission]);

  function saveField(field: string, value: string) {
    setMessage("Guardando…");
    const toastId = toast.loading("Guardando cambios…");
    startTransition(async () => {
      try {
        const updated = field === "status"
          ? await patchMissionStatus(currentMission.id, value as TlozMissionStatus)
          : await updateMission(currentMission.id, {
              [field]: field === "progress" ? Number(value) : value,
            });
        setCurrentMission(updated);
        onMissionChange?.(updated);
        setMessage("Cambios guardados.");
        toast.success("Misión actualizada", { id: toastId, description: `${fieldLabel(field)} se guardó correctamente.` });
      } catch {
        setMessage("No se pudo guardar. Intenta nuevamente.");
        toast.error("No se pudo actualizar la misión", { id: toastId, description: "Revisa el campo e intenta nuevamente." });
      }
    });
  }

  return (
    <div className="flex flex-col gap-2.5" aria-busy={isPending}>
      <PickerField label="Icono">
        <IconPicker
          icons={missionIcons}
          value={currentMission.icon}
          color={missionTypeTone[currentMission.type]}
          recentStorageKey="zipform-tloz-recent-icons"
          onValueChange={(value) => saveField("icon", value)}
        />
      </PickerField>
      <EditableMetaField label="Título" value={currentMission.title} displayValue={currentMission.title} onSave={(value) => saveField("title", value)} />
      <EditableMetaField label="Descripción" value={currentMission.description} displayValue={currentMission.description || "Sin descripción"} onSave={(value) => saveField("description", value)} />
      <EditableMetaField label="Resultado" value={currentMission.conclusion ?? ""} displayValue={currentMission.conclusion || "Sin resultado definido"} onSave={(value) => saveField("conclusion", value)} />
      <EditableMetaField label="Estado" value={currentMission.status} displayValue={statuses.find((item) => item.value === currentMission.status)?.label ?? currentMission.status} options={statuses} onSave={(value) => saveField("status", value)} />
      <EditableMetaField label="Tipo" value={currentMission.type} displayValue={missionTypes.find((item) => item.value === currentMission.type)?.label ?? currentMission.type} options={missionTypes} onSave={(value) => saveField("type", value)} />
      <EditableMetaField label="Progreso" value={String(currentMission.progress)} displayValue={`${currentMission.progress}%`} type="number" min="0" max="100" onSave={(value) => saveField("progress", value)} />
      <PickerField label="Fecha límite">
        <DatePicker value={currentMission.dueDate} label="Fecha límite" clearable={false} onValueChange={(value) => value && saveField("dueDate", value)} />
      </PickerField>
      {options?.projects.length ? (
        <EditableMetaField label="Proyecto" value={currentMission.projectId} displayValue={currentMission.project.name} options={options.projects.map((project) => ({ value: project.id, label: project.name }))} onSave={(value) => saveField("projectId", value)} />
      ) : null}
      {options?.episodes.length ? (
        <EditableMetaField label="Episodio" value={currentMission.episodeId ?? ""} displayValue={currentMission.episode?.name ?? "Sin episodio"} options={[{ value: "", label: "Sin episodio" }, ...options.episodes.map((episode) => ({ value: episode.id, label: episode.name }))]} onSave={(value) => saveField("episodeId", value)} />
      ) : null}
      {options?.users.length ? (
        <PickerField label="Owner">
          <UserPicker users={options.users} value={currentMission.ownerId} onValueChange={(value) => saveField("ownerId", value)} />
        </PickerField>
      ) : null}
      <p className={message.startsWith("No se pudo") ? "m-0 text-xs font-semibold text-[#B91C22]" : "m-0 text-xs text-carbon/50"} aria-live="polite">{message}</p>
    </div>
  );
}

function fieldLabel(field: string) {
  const labels: Record<string, string> = {
    icon: "El icono",
    title: "El título",
    description: "La descripción",
    conclusion: "El resultado",
    status: "El estado",
    type: "El tipo",
    progress: "El progreso",
    dueDate: "La fecha límite",
    projectId: "El proyecto",
    episodeId: "El episodio",
    ownerId: "El responsable",
  };
  return labels[field] ?? "El campo";
}

function PickerField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[11px] bg-carbon/5 p-3">
      <span className="mb-1.5 block text-[10.5px] font-bold uppercase text-carbon/45">{label}</span>
      {children}
    </div>
  );
}

function EditableMetaField({ label, value, displayValue, options, type = "text", min, max, onSave }: {
  label: string;
  value: string;
  displayValue: string;
  options?: Array<{ value: string; label: string }>;
  type?: "text" | "number" | "date";
  min?: string;
  max?: string;
  onSave: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  function commit() {
    setEditing(false);
    if (draft !== value) onSave(draft);
  }

  if (editing) {
    return (
      <label className="rounded-[11px] bg-carbon/5 p-3 focus-within:ring-2 focus-within:ring-zivelo/20">
        <span className="mb-1 block text-[10.5px] font-bold uppercase text-carbon/45">{label}</span>
        <span className="flex items-center gap-1.5">
          {options ? (
            <select
              autoFocus
              autoComplete="off"
              className="min-h-9 min-w-0 flex-1 rounded-lg border border-carbon/15 bg-paper px-2 text-[13px] font-semibold"
              name={label.toLowerCase().replaceAll(" ", "-")}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") { setDraft(value); setEditing(false); }
                if (event.key === "Enter") commit();
              }}
            >
              {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          ) : (
            <input
              autoFocus
              autoComplete="off"
              className="min-h-9 min-w-0 flex-1 rounded-lg border border-carbon/15 bg-paper px-2 text-[13px] font-semibold"
              type={type}
              name={label.toLowerCase().replaceAll(" ", "-")}
              min={min}
              max={max}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") { setDraft(value); setEditing(false); }
                if (event.key === "Enter") commit();
              }}
            />
          )}
          <button type="button" className="grid size-8 place-items-center rounded-lg text-carbon/60 hover:bg-carbon/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zivelo" aria-label={`Guardar ${label}`} onClick={commit}>
            <Check aria-hidden="true" />
          </button>
          <button type="button" className="grid size-8 place-items-center rounded-lg text-carbon/60 hover:bg-carbon/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zivelo" aria-label={`Cancelar edición de ${label}`} onClick={() => { setDraft(value); setEditing(false); }}>
            <X aria-hidden="true" />
          </button>
        </span>
      </label>
    );
  }

  return (
    <button
      type="button"
      className="group flex min-h-[58px] w-full items-center gap-3 rounded-[11px] bg-carbon/5 p-3 text-left transition-colors hover:bg-carbon/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zivelo"
      aria-label={`Editar ${label}: ${displayValue}`}
      onClick={() => setEditing(true)}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[10.5px] font-bold uppercase text-carbon/45">{label}</span>
        <span className="mt-1 block truncate text-[13px] font-semibold">{displayValue}</span>
      </span>
      <Pencil className="text-carbon/35 group-hover:text-carbon/65" aria-hidden="true" />
    </button>
  );
}
