import type {
  TlozDocument,
  TlozDocumentKind,
  TlozDocumentScalar,
  TlozFieldDefinition,
  TlozFieldOption,
  TlozFieldType,
  TlozProjectContract,
  TlozStatusRole,
} from "@tloz/types";
import { parse, stringify } from "yaml";
import { TlozDocumentError } from "./document-errors";

const DOCUMENT_KINDS = new Set<TlozDocumentKind>(["project", "mission", "inventory"]);
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
const SYSTEM_KEYS = new Set(["id", "type", "parent", "contract"]);

export type ParsedTlozDocument = {
  publicId: string;
  kind: TlozDocumentKind;
  parentPublicId?: string;
  title: string;
  body: string;
  properties: Record<string, TlozDocumentScalar>;
  contract?: TlozProjectContract;
};

export function serializeTlozDocumentMarkdown(document: TlozDocument): string {
  const frontmatter: Record<string, unknown> = {
    id: document.publicId,
    type: document.kind,
  };
  if (document.parentPublicId) frontmatter.parent = document.parentPublicId;
  for (const [key, value] of Object.entries(document.properties)) {
    if (!SYSTEM_KEYS.has(key)) frontmatter[key] = value;
  }
  if (document.kind === "project" && document.contract) {
    frontmatter.contract = {
      fields: document.contract.fields.map(serializeFieldDefinition),
    };
  }

  const yaml = stringify(frontmatter, { lineWidth: 0 }).trimEnd();
  const body = document.body.trim();
  return `---\n${yaml}\n---\n\n# ${document.title.trim()}${body ? `\n\n${body}` : ""}\n`;
}

export function parseTlozDocumentMarkdown(markdown: string): ParsedTlozDocument {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();
  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/);
  if (!match) {
    throw invalidDocument("El documento requiere frontmatter YAML delimitado por ---.", {
      frontmatter: "required",
    });
  }

  let raw: unknown;
  try {
    raw = parse(match[1]);
  } catch {
    throw invalidDocument("El frontmatter YAML no es válido.", { frontmatter: "invalid" });
  }
  if (!isRecord(raw)) {
    throw invalidDocument("El frontmatter debe ser un mapa YAML.", { frontmatter: "invalid" });
  }

  const publicId = requiredString(raw.id, "id");
  const kind = requiredString(raw.type, "type") as TlozDocumentKind;
  if (!DOCUMENT_KINDS.has(kind)) {
    throw invalidDocument("type debe ser project, mission o inventory.", { type: "invalid" });
  }
  const parentPublicId = optionalString(raw.parent, "parent");
  if (kind !== "project" && !parentPublicId) {
    throw invalidDocument("Las missions y los documentos de inventory requieren parent.", {
      parent: "required",
    });
  }

  const content = match[2].trim();
  const heading = content.match(/^# (.+?)(?:\n|$)([\s\S]*)$/);
  if (!heading) {
    throw invalidDocument("El primer elemento del documento debe ser un H1.", {
      title: "required",
    });
  }
  const title = heading[1].trim();
  if (!title) {
    throw invalidDocument("El H1 no puede estar vacío.", { title: "required" });
  }

  const properties: Record<string, TlozDocumentScalar> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (SYSTEM_KEYS.has(key)) continue;
    properties[key] = parseScalar(value, key);
  }

  const contract = raw.contract === undefined
    ? undefined
    : parseProjectContract(raw.contract, publicId, kind);

  return {
    publicId,
    kind,
    parentPublicId,
    title,
    body: heading[2].trim(),
    properties,
    contract,
  };
}

function serializeFieldDefinition(field: TlozFieldDefinition) {
  return {
    key: field.key,
    label: field.label,
    type: field.type,
    required: field.required,
    visible: field.visible,
    position: field.position,
    ...(field.defaultValue === undefined ? {} : { default: field.defaultValue }),
    ...(field.options.length ? { options: field.options } : {}),
  };
}

function parseProjectContract(
  value: unknown,
  projectId: string,
  kind: TlozDocumentKind,
): TlozProjectContract {
  if (kind !== "project") {
    throw invalidDocument("Solo un project puede declarar contract.", { contract: "forbidden" });
  }
  if (!isRecord(value) || !Array.isArray(value.fields)) {
    throw invalidDocument("contract.fields debe ser una lista.", { contract: "invalid" });
  }
  const fields = value.fields.map((field, index) => parseFieldDefinition(field, index));
  const keys = new Set<string>();
  for (const field of fields) {
    if (keys.has(field.key)) {
      throw invalidDocument(`El campo ${field.key} está duplicado.`, {
        [`contract.fields.${field.key}`]: "duplicate",
      });
    }
    keys.add(field.key);
  }
  return { projectId, fields };
}

function parseFieldDefinition(value: unknown, index: number): TlozFieldDefinition {
  const prefix = `contract.fields.${index}`;
  if (!isRecord(value)) {
    throw invalidDocument("Cada field del contrato debe ser un mapa.", { [prefix]: "invalid" });
  }
  const key = requiredString(value.key, `${prefix}.key`);
  if (!/^[a-z][a-z0-9_-]*$/.test(key) || SYSTEM_KEYS.has(key)) {
    throw invalidDocument(`La key ${key} no es válida.`, { [`${prefix}.key`]: "invalid" });
  }
  const type = requiredString(value.type, `${prefix}.type`) as TlozFieldType;
  if (!FIELD_TYPES.has(type)) {
    throw invalidDocument(`El tipo ${type} no está soportado.`, { [`${prefix}.type`]: "invalid" });
  }
  const options = value.options === undefined
    ? []
    : parseOptions(value.options, `${prefix}.options`);
  if ((type === "select" || type === "multiselect") && options.length === 0) {
    throw invalidDocument(`El campo ${key} requiere options.`, { [`${prefix}.options`]: "required" });
  }
  return {
    id: typeof value.id === "string" ? value.id : key,
    key,
    label: requiredString(value.label, `${prefix}.label`),
    type,
    required: optionalBoolean(value.required, `${prefix}.required`) ?? false,
    visible: optionalBoolean(value.visible, `${prefix}.visible`) ?? true,
    position: optionalNumber(value.position, `${prefix}.position`) ?? index,
    ...(value.default === undefined ? {} : { defaultValue: parseScalar(value.default, `${prefix}.default`) }),
    options,
  };
}

function parseOptions(value: unknown, field: string): TlozFieldOption[] {
  if (!Array.isArray(value)) {
    throw invalidDocument(`${field} debe ser una lista.`, { [field]: "invalid" });
  }
  return value.map((option, index) => {
    const path = `${field}.${index}`;
    if (!isRecord(option)) {
      throw invalidDocument("Cada opción debe ser un mapa.", { [path]: "invalid" });
    }
    const role = optionalString(option.role, `${path}.role`) as TlozStatusRole | undefined;
    if (role && !STATUS_ROLES.has(role)) {
      throw invalidDocument(`El rol ${role} no está soportado.`, { [`${path}.role`]: "invalid" });
    }
    return {
      value: requiredString(option.value, `${path}.value`),
      label: requiredString(option.label, `${path}.label`),
      ...(optionalString(option.color, `${path}.color`) ? { color: String(option.color) } : {}),
      ...(role ? { role } : {}),
    };
  });
}

function parseScalar(value: unknown, field: string): TlozDocumentScalar {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value;
  }
  throw invalidDocument(`${field} debe ser un valor escalar o una lista de texto.`, {
    [field]: "invalid",
  });
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw invalidDocument(`${field} es obligatorio.`, { [field]: "required" });
  }
  return value.trim();
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    throw invalidDocument(`${field} debe ser texto.`, { [field]: "invalid" });
  }
  return value.trim() || undefined;
}

function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    throw invalidDocument(`${field} debe ser boolean.`, { [field]: "invalid" });
  }
  return value;
}

function optionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw invalidDocument(`${field} debe ser un entero positivo.`, { [field]: "invalid" });
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidDocument(message: string, fields: Record<string, string>) {
  return new TlozDocumentError("DOCUMENT_INVALID", message, fields);
}
