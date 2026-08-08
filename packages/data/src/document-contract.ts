import type {
  TlozDocumentKind,
  TlozDocumentScalar,
  TlozFieldDefinition,
  TlozFieldOption,
  TlozFieldType,
  TlozStatusRole,
} from "@tloz/types";
import { TlozDocumentError } from "./document-errors";

export const DEFAULT_MISSION_STATUS_OPTIONS: TlozFieldOption[] = [
  { value: "later", label: "Later", role: "backlog", color: "#6B6B6B" },
  { value: "next", label: "Next", role: "ready", color: "#3A47B5" },
  { value: "now", label: "Now", role: "active", color: "#1E8E5A" },
  { value: "blocked", label: "Blocked", role: "blocked", color: "#B91C22" },
  { value: "completed", label: "Completed", role: "done", color: "#1E6B3C" },
];

export const DEFAULT_MISSION_CATEGORY_OPTIONS: TlozFieldOption[] = [
  { value: "main_quest", label: "Main Quest" },
  { value: "side_quest", label: "Side Quest" },
  { value: "farming_quest", label: "Farming Quest" },
  { value: "exploration_quest", label: "Exploration Quest" },
];

export const DEFAULT_INVENTORY_STATUS_OPTIONS: TlozFieldOption[] = [
  { value: "locked", label: "Bloqueado", role: "backlog", color: "#7A5A12" },
  { value: "unlocked", label: "Desbloqueado", role: "done", color: "#1E6B3C" },
];

export const DEFAULT_INVENTORY_CATEGORY_OPTIONS: TlozFieldOption[] = [
  { value: "tool", label: "Herramienta" },
  { value: "access", label: "Acceso" },
  { value: "asset", label: "Activo" },
  { value: "document", label: "Documento" },
  { value: "other", label: "Otro" },
];

export function defaultMissionFields(projectId: string): TlozFieldDefinition[] {
  return [
    field(projectId, "status", "Estado", "select", 0, "later", DEFAULT_MISSION_STATUS_OPTIONS),
    field(projectId, "category", "Categoría", "select", 1, "side_quest", DEFAULT_MISSION_CATEGORY_OPTIONS),
  ];
}

export function defaultInventoryFields(projectId: string): TlozFieldDefinition[] {
  return [
    field(projectId, "status", "Estado", "select", 0, "locked", DEFAULT_INVENTORY_STATUS_OPTIONS),
    field(projectId, "category", "Categoría", "select", 1, "other", DEFAULT_INVENTORY_CATEGORY_OPTIONS),
  ];
}

export function validateProjectFields(fields: TlozFieldDefinition[]): TlozFieldDefinition[] {
  const keys = new Set<string>();
  const normalized = fields.map((candidate, position) => {
    if (
      !candidate
      || typeof candidate.key !== "string"
      || typeof candidate.label !== "string"
      || typeof candidate.type !== "string"
      || typeof candidate.required !== "boolean"
      || typeof candidate.visible !== "boolean"
      || !Array.isArray(candidate.options)
    ) {
      throw invalidField(String(candidate?.key ?? position), "La definición del campo no es válida.");
    }
    const key = candidate.key.trim();
    if (!/^[a-z][a-z0-9_-]*$/.test(key) || ["id", "type", "parent", "contract"].includes(key)) {
      throw invalidField(candidate.key, "La key del campo no es válida.");
    }
    if (keys.has(key)) throw invalidField(key, "La key del campo está duplicada.");
    keys.add(key);
    if (!FIELD_TYPES.has(candidate.type)) throw invalidField(key, "El tipo del campo no está soportado.");
    if ((candidate.type === "select" || candidate.type === "multiselect") && candidate.options.length === 0) {
      throw invalidField(key, "Los campos select requieren opciones.");
    }
    if ((key === "status" || key === "category") && candidate.type !== "select") {
      throw invalidField(key, `${candidate.label.trim() || key} debe ser un campo select.`);
    }
    const optionValues = new Set<string>();
    const options = candidate.options.map((option) => {
      const value = option.value.trim();
      const label = option.label.trim();
      if (!value || !label || optionValues.has(value)) {
        throw invalidField(key, "Las opciones requieren value y label únicos.");
      }
      optionValues.add(value);
      if (option.role && !STATUS_ROLES.has(option.role)) {
        throw invalidField(key, `El rol ${option.role} no está soportado.`);
      }
      if (key === "status" && !option.role) {
        throw invalidField(key, "Cada estado requiere un rol semántico.");
      }
      return { ...option, value, label };
    });
    if (key === "status" && !options.some((option) => option.role === "done")) {
      throw invalidField(key, "El contrato necesita al menos un estado con rol done.");
    }
    if (
      candidate.defaultValue !== undefined
      && (candidate.type === "select" || candidate.type === "multiselect")
    ) {
      const defaults = Array.isArray(candidate.defaultValue)
        ? candidate.defaultValue
        : [candidate.defaultValue];
      if (!defaults.every((value) => typeof value === "string" && optionValues.has(value))) {
        throw invalidField(key, "El default no pertenece a las opciones del campo.");
      }
    }
    return {
      ...candidate,
      id: typeof candidate.id === "string" && candidate.id ? candidate.id : key,
      key,
      label: candidate.label.trim() || key,
      position,
      options,
    };
  });
  for (const requiredKey of ["status", "category"]) {
    if (!keys.has(requiredKey)) {
      throw invalidField(requiredKey, `El contrato requiere el campo ${requiredKey}.`);
    }
  }
  return normalized;
}

export function validateDocumentProperties(
  fields: TlozFieldDefinition[],
  properties: Record<string, TlozDocumentScalar>,
  kind: TlozDocumentKind,
) {
  const definitions = new Map(fields.map((definition) => [definition.key, definition]));
  const systemKeys = SYSTEM_PROPERTY_KEYS[kind];
  for (const [key, value] of Object.entries(properties)) {
    if (systemKeys.has(key)) {
      validateSystemProperty(kind, key, value);
      continue;
    }
    const definition = definitions.get(key);
    if (!definition) {
      throw new TlozDocumentError("DOCUMENT_INVALID", `El campo ${key} no pertenece al contrato.`, {
        [`properties.${key}`]: "unknown",
      });
    }
    validatePropertyValue(definition, value);
  }
}

function validateSystemProperty(
  kind: TlozDocumentKind,
  key: string,
  value: TlozDocumentScalar,
) {
  const invalid = () => new TlozDocumentError(
    "DOCUMENT_INVALID",
    `El valor de ${key} no coincide con su tipo.`,
    { [`properties.${key}`]: "invalid" },
  );
  const nullable = key === "due"
    || key === "blocked_reason"
    || key === "acquired"
    || (kind !== "project" && key === "start")
    || (kind === "inventory" && key === "assignee");
  if (value === null) {
    if (!nullable) throw invalid();
    return;
  }
  if (key === "progress") {
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 100) {
      throw invalid();
    }
    return;
  }
  if (key === "start" || key === "due" || key === "acquired") {
    if (
      typeof value !== "string"
      || !/^\d{4}-\d{2}-\d{2}$/.test(value)
      || Number.isNaN(new Date(`${value}T00:00:00.000Z`).valueOf())
    ) {
      throw invalid();
    }
    return;
  }
  if (typeof value !== "string") throw invalid();
}

const FIELD_TYPES = new Set<TlozFieldType>([
  "text",
  "number",
  "boolean",
  "date",
  "select",
  "multiselect",
  "person",
  "relation",
]);
const STATUS_ROLES = new Set<TlozStatusRole>(["backlog", "ready", "active", "blocked", "done"]);
const SYSTEM_PROPERTY_KEYS: Record<TlozDocumentKind, Set<string>> = {
  project: new Set(["status", "category", "owner", "color", "icon", "start", "due"]),
  mission: new Set(["assignee", "icon", "start", "due", "progress", "blocked_reason"]),
  inventory: new Set(["assignee", "icon", "acquired"]),
};

function validatePropertyValue(definition: TlozFieldDefinition, value: TlozDocumentScalar) {
  if (value === null) return;
  const invalid = () => new TlozDocumentError(
    "DOCUMENT_INVALID",
    `El valor de ${definition.key} no coincide con su tipo.`,
    { [`properties.${definition.key}`]: "invalid" },
  );
  switch (definition.type) {
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) throw invalid();
      return;
    case "boolean":
      if (typeof value !== "boolean") throw invalid();
      return;
    case "date":
      if (
        typeof value !== "string"
        || !/^\d{4}-\d{2}-\d{2}$/.test(value)
        || Number.isNaN(new Date(`${value}T00:00:00.000Z`).valueOf())
      ) {
        throw invalid();
      }
      return;
    case "multiselect":
      if (
        !Array.isArray(value)
        || !value.every((item) => definition.options.some((option) => option.value === item))
      ) {
        throw invalid();
      }
      return;
    case "select":
      if (
        typeof value !== "string"
        || !definition.options.some((option) => option.value === value)
      ) {
        throw invalid();
      }
      return;
    case "text":
    case "person":
    case "relation":
      if (typeof value !== "string") throw invalid();
  }
}


function field(
  projectId: string,
  key: string,
  label: string,
  type: TlozFieldType,
  position: number,
  defaultValue: string,
  options: TlozFieldOption[],
): TlozFieldDefinition {
  return {
    id: `${projectId}:${key}`,
    key,
    label,
    type,
    required: true,
    visible: true,
    position,
    defaultValue,
    options: options.map((option) => ({ ...option })),
  };
}

function invalidField(key: string, message: string) {
  return new TlozDocumentError("DOCUMENT_INVALID", message, {
    [`contract.fields.${key || "unknown"}`]: "invalid",
  });
}
