import type { TlozMissionCreateInput, TlozProjectCreateInput, TlozQuestItemCreateInput } from "./contracts";

export class TlozValidationError extends Error {
  constructor(public readonly fields: Record<string, string>) { super("Los datos de TLOZ no son válidos"); this.name = "TlozValidationError"; }
}

function required(value: string | undefined, field: string, label: string, fields: Record<string, string>, min = 1) {
  if (!value?.trim()) fields[field] = `${label} es obligatorio.`;
  else if (value.trim().length < min) fields[field] = `${label} debe tener al menos ${min} caracteres.`;
}
function dates(startDate: string | undefined, dueDate: string | undefined, fields: Record<string, string>) {
  if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) fields.startDate = "La fecha de inicio no es válida.";
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) fields.dueDate = "La fecha límite no es válida.";
  if (startDate && dueDate && dueDate < startDate) fields.dueDate = "La fecha límite debe ser posterior al inicio.";
}
function finish(fields: Record<string, string>) { if (Object.keys(fields).length) throw new TlozValidationError(fields); }

export function validateMissionCreate(input: TlozMissionCreateInput) {
  const fields: Record<string, string> = {};
  const normalized = {
    ...input,
    description: input.description ?? "",
    icon: input.icon ?? "Sword",
    status: input.status ?? "next",
    progress: input.progress ?? 0,
  };
  required(input.title, "title", "El título", fields, 3);
  required(input.type, "type", "El tipo", fields);
  required(input.projectId, "projectId", "El proyecto", fields);
  required(input.ownerId, "ownerId", "El responsable", fields);
  if ((input.title?.trim().length ?? 0) > 160) fields.title = "El título no puede superar 160 caracteres.";
  if (input.type && !["main_quest", "side_quest", "farming_quest", "exploration_quest"].includes(input.type)) {
    fields.type = "El tipo de misión no es válido.";
  }
  if (normalized.status && !["now", "next", "later", "completed", "blocked"].includes(normalized.status)) {
    fields.status = "El estado de la misión no es válido.";
  }
  if (normalized.description.length > 5000) fields.description = "La descripción no puede superar 5000 caracteres.";
  if (!Number.isInteger(normalized.progress) || normalized.progress < 0 || normalized.progress > 100) {
    fields.progress = "El progreso debe ser un entero entre 0 y 100.";
  }
  dates(input.startDate, input.dueDate, fields);
  finish(fields);
  return { ...normalized, title: input.title.trim(), description: normalized.description.trim() };
}

export function validateProjectCreate(input: TlozProjectCreateInput) {
  const fields: Record<string, string> = {};
  required(input.name, "name", "El nombre", fields, 2); required(input.ownerId, "ownerId", "El responsable", fields); required(input.startDate, "startDate", "La fecha de inicio", fields);
  if (!/^#[0-9A-F]{6}$/i.test(input.color)) fields.color = "El color debe ser un HEX válido.";
  dates(input.startDate, input.dueDate, fields); finish(fields); return { ...input, name: input.name.trim(), description: input.description.trim(), color: input.color.toUpperCase() };
}

export function validateQuestItemCreate(input: TlozQuestItemCreateInput) {
  const fields: Record<string, string> = {};
  required(input.name, "name", "El nombre", fields, 2); required(input.icon, "icon", "El icono", fields);
  if (input.description.length > 5000) fields.description = "La descripción no puede superar 5000 caracteres.";
  if (input.status === "unlocked" && !input.acquiredAt) fields.acquiredAt = "Un item desbloqueado necesita fecha de adquisición.";
  finish(fields); return { ...input, name: input.name.trim(), description: input.description.trim() };
}

export function slugify(value: string) { return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "project"; }
export function uniqueSlug(name: string, existing: string[]) { const base = slugify(name); let candidate = base; let suffix = 2; while (existing.includes(candidate)) candidate = `${base}-${suffix++}`; return candidate; }
export function nextMissionDisplayId(projectName: string, existing: string[]) { const key = projectName.normalize("NFKD").replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase().padEnd(3, "X"); const max = existing.filter((id) => id.startsWith(`${key}-`)).reduce((value, id) => Math.max(value, Number(id.slice(4)) || 0), 0); return `${key}-${String(max + 1).padStart(4, "0")}`; }
