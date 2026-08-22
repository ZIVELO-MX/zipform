"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Button,
  ColorPicker,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
  useOverlayToasterId,
} from "@tloz/ui";
import type {
  TlozDocument,
  TlozDocumentPresentationField,
  TlozDocumentScalar,
  TlozFieldDefinition,
} from "@tloz/types";
import { updateDocumentProperties } from "../../app/tloz/actions";
import { DetailPropertyRow } from "./detail-property-row";
import {
  documentValue,
  isDocumentDetailValuePresent,
} from "./document-view-model";
import { formatDate, resolveStatusPresentation } from "./tloz-utils";

export function DocumentPropertyFields({
  document,
  fields,
  presentationFields = [],
  users,
  readOnly = false,
  moveReadOnly = readOnly,
  onDocumentChange,
}: {
  document?: TlozDocument;
  fields: TlozFieldDefinition[];
  presentationFields?: TlozDocumentPresentationField[];
  users: Array<{ id: string; name: string }>;
  readOnly?: boolean;
  moveReadOnly?: boolean;
  onDocumentChange?: (document: TlozDocument) => void;
}) {
  const [current, setCurrent] = useState(document);
  const [pending, startTransition] = useTransition();
  const toasterId = useOverlayToasterId();

  useEffect(() => setCurrent(document), [document]);
  if (!current) return null;
  const customFields = fields.filter(
    (field) => field.visible && field.key !== "status" && field.key !== "category",
  );
  const customKeys = new Set(customFields.map((field) => field.key));
  const visibleCustomFields = customFields.flatMap((field) => {
    const value = current.properties[field.key] ?? null;
    return isDocumentDetailValuePresent(value) || !readOnly ? [{ field, value }] : [];
  });
  const visiblePresentationFields = presentationFields.flatMap((field) => {
    const value = documentValue(current, field.key);
    const editable = !readOnly
      && !customKeys.has(field.key)
      && EDITABLE_SYSTEM_PRESENTATION_FIELDS.has(field.key)
      && !READ_ONLY_PRESENTATION_FIELDS.has(field.key)
      && field.format !== "id";
    return isDocumentDetailValuePresent(value) || editable ? [{ field, value, editable }] : [];
  });
  if (!visibleCustomFields.length && !visiblePresentationFields.length) return null;

  function persist(field: TlozFieldDefinition, value: TlozDocumentScalar) {
    if (!current) return;
    const toastId = toast.loading(`Guardando ${field.label}…`, { toasterId });
    startTransition(async () => {
      try {
        const updated = await updateDocumentProperties(
          current.id,
          { [field.key]: value },
          current.revision,
        );
        setCurrent(updated);
        onDocumentChange?.(updated);
        toast.success(`${field.label} actualizado`, { id: toastId, toasterId });
      } catch (error) {
        toast.error(documentMutationError(error, `No se pudo guardar ${field.label}`), { id: toastId, toasterId });
      }
    });
  }

  return (
    <div className="flex flex-col border-t border-carbon/[0.07] pt-1" aria-busy={pending}>
      {visibleCustomFields.map(({ field, value }) => (
        <DetailPropertyRow
          key={field.id}
          label={field.label}
          display={<PropertyValue field={field} value={value} users={users} />}
          readOnly={readOnly}
        >
          <PropertyEditor
            field={field}
            value={value}
            users={users}
            onChange={(next) => persist(field, next)}
          />
        </DetailPropertyRow>
      ))}
      {visiblePresentationFields.map(({ field, value, editable }) => {
        const definition = presentationFieldDefinition(field);
        const fieldReadOnly = !editable
          || ((field.key === "owner" || field.key === "assignee") && moveReadOnly);
        return (
        <DetailPropertyRow
          key={field.key}
          label={field.label}
          display={<PresentationValue field={field} value={value} users={users} kind={current.kind} />}
          readOnly={fieldReadOnly}
        >
          {fieldReadOnly ? null : (
            <PropertyEditor
              field={definition}
              value={value}
              users={users}
              onChange={(next) => persist(definition, next)}
            />
          )}
        </DetailPropertyRow>
        );
      })}
    </div>
  );
}

const READ_ONLY_PRESENTATION_FIELDS = new Set([
  "publicId",
  "project",
  "mission_count",
]);

const EDITABLE_SYSTEM_PRESENTATION_FIELDS = new Set([
  "status",
  "category",
  "owner",
  "assignee",
  "color",
  "icon",
  "start",
  "due",
  "progress",
  "blocked_reason",
  "acquired",
]);

function presentationFieldDefinition(
  field: TlozDocumentPresentationField,
): TlozFieldDefinition {
  const type = field.format === "status"
    ? "select"
    : field.format === "person"
      ? "person"
      : field.format === "date"
        ? "date"
        : field.format === "number"
          ? "number"
          : "text";
  return {
    id: `presentation:${field.key}`,
    key: field.key,
    label: field.label,
    type,
    required: false,
    visible: field.visible,
    position: field.position,
    options: field.options ?? [],
  };
}

function documentMutationError(error: unknown, fallback: string) {
  if (
    typeof error === "object"
    && error !== null
    && "code" in error
    && error.code === "DOCUMENT_REVISION_CONFLICT"
  ) {
    return "El documento cambió. Recarga el detalle e intenta de nuevo.";
  }
  return fallback;
}

export function CreateDocumentPropertyInputs({
  fields,
  values,
  users,
  onChange,
}: {
  fields: TlozFieldDefinition[];
  values: Record<string, TlozDocumentScalar>;
  users: Array<{ id: string; name: string }>;
  onChange: (key: string, value: TlozDocumentScalar) => void;
}) {
  const customFields = fields.filter(
    (field) => field.visible && field.key !== "status" && field.key !== "category",
  );
  if (!customFields.length) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {customFields.map((field) => {
        const value = values[field.key] ?? field.defaultValue ?? null;
        return (
          <label key={field.id} className="flex min-w-0 flex-col gap-1.5">
            <span className="text-xs font-bold text-carbon/60">
              {field.label}
              {field.required ? <span className="text-zivelo"> *</span> : null}
            </span>
            <CreatePropertyEditor
              field={field}
              value={value}
              users={users}
              onChange={(next) => onChange(field.key, next)}
            />
          </label>
        );
      })}
    </div>
  );
}

function PropertyValue({
  field,
  value,
  users,
}: {
  field: TlozFieldDefinition;
  value: TlozDocumentScalar;
  users: Array<{ id: string; name: string }>;
}) {
  if (value === null || value === "" || (Array.isArray(value) && !value.length)) {
    return <span className={field.required ? "font-semibold text-[#B91C22]" : "text-carbon/40"}>{field.required ? "Pendiente" : "—"}</span>;
  }
  if (field.type === "boolean") return <span>{value ? "Sí" : "No"}</span>;
  if (field.key === "color" && typeof value === "string") return <ColorValue value={value} />;
  if (field.type === "person") return <span>{users.find((user) => user.id === value)?.name ?? String(value)}</span>;
  if (field.type === "select") return <span>{field.options.find((option) => option.value === value)?.label ?? String(value)}</span>;
  if (Array.isArray(value)) {
    return <span className="line-clamp-2">{value.map((item) => field.options.find((option) => option.value === item)?.label ?? item).join(", ")}</span>;
  }
  return <span className={field.type === "number" || field.type === "date" ? "font-mono text-[12px]" : ""}>{String(value)}</span>;
}

function PresentationValue({
  field,
  value,
  users,
  kind,
}: {
  field: TlozDocumentPresentationField;
  value: TlozDocumentScalar;
  users: Array<{ id: string; name: string }>;
  kind: TlozDocument["kind"];
}) {
  if (field.key === "color" && typeof value === "string") {
    return <ColorValue value={value} />;
  }
  if (field.format === "status" && typeof value === "string") {
    const status = resolveStatusPresentation(value, field.options, kind);
    return (
      <span
        className="inline-block rounded-full px-[9px] py-[3px] text-[11px] font-bold"
        style={{ background: `${status.textColor}18`, color: status.textColor }}
      >
        {status.label}
      </span>
    );
  }
  if (field.format === "person" && typeof value === "string") {
    return <span>{users.find((user) => user.id === value)?.name ?? value}</span>;
  }
  if (field.format === "date" && typeof value === "string") {
    return <span className="font-mono text-[11.5px] text-carbon/55">{formatDate(value)}</span>;
  }
  if (field.format === "id" || field.format === "number") {
    return <span className="font-mono text-[11.5px] text-carbon/55">{displayValue(value, field)}</span>;
  }
  return <span className="text-xs text-carbon/65">{displayValue(value, field)}</span>;
}

function PropertyEditor({
  field,
  value,
  users,
  onChange,
}: {
  field: TlozFieldDefinition;
  value: TlozDocumentScalar;
  users: Array<{ id: string; name: string }>;
  onChange: (value: TlozDocumentScalar) => void;
}) {
  if (field.key === "color") {
    return (
      <ColorPicker
        value={typeof value === "string" ? value : "#6B6B6B"}
        onValueChange={onChange}
      />
    );
  }
  if (field.type === "select" || field.type === "boolean" || field.type === "person") {
    const options = field.type === "boolean"
      ? [{ value: "true", label: "Sí" }, { value: "false", label: "No" }]
      : field.type === "person"
        ? users.map((user) => ({ value: user.id, label: user.name }))
        : field.options;
    return (
      <Select
        value={value === null ? undefined : String(value)}
        onValueChange={(next) => onChange(field.type === "boolean" ? next === "true" : next)}
      >
        <SelectTrigger aria-label={field.label}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
        <SelectContent><SelectGroup>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectGroup></SelectContent>
      </Select>
    );
  }

  if (field.type === "multiselect") {
    const selected = new Set(Array.isArray(value) ? value : []);
    return (
      <div className="flex max-h-44 flex-col gap-1 overflow-auto p-1">
        {field.options.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant="ghost"
            size="sm"
            className={`justify-start ${selected.has(option.value) ? "bg-carbon/[0.07] text-carbon" : ""}`}
            onClick={() => {
              const next = new Set(selected);
              if (next.has(option.value)) next.delete(option.value);
              else next.add(option.value);
              onChange(Array.from(next));
            }}
          >
            {option.label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <BlurInput
      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
      label={field.label}
      value={value === null || Array.isArray(value) ? "" : String(value)}
      onSave={(next) => onChange(field.type === "number" ? (next ? Number(next) : null) : next || null)}
    />
  );
}

function displayValue(
  value: TlozDocumentScalar,
  field: TlozDocumentPresentationField,
) {
  if (value === null) return "";
  if (Array.isArray(value)) {
    return value
      .map((item) => field.options?.find((option) => option.value === item)?.label ?? item)
      .join(", ");
  }
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "string") {
    return field.options?.find((option) => option.value === value)?.label ?? value;
  }
  return String(value);
}

function CreatePropertyEditor({
  field,
  value,
  users,
  onChange,
}: {
  field: TlozFieldDefinition;
  value: TlozDocumentScalar;
  users: Array<{ id: string; name: string }>;
  onChange: (value: TlozDocumentScalar) => void;
}) {
  if (field.key === "color") {
    return (
      <ColorPicker
        value={typeof value === "string" ? value : "#6B6B6B"}
        onValueChange={onChange}
      />
    );
  }
  if (field.type === "select" || field.type === "boolean" || field.type === "person") {
    const options = field.type === "boolean"
      ? [{ value: "true", label: "Sí" }, { value: "false", label: "No" }]
      : field.type === "person"
        ? users.map((user) => ({ value: user.id, label: user.name }))
        : field.options;
    return (
      <Select
        value={value === null ? undefined : String(value)}
        onValueChange={(next) => onChange(field.type === "boolean" ? next === "true" : next)}
      >
        <SelectTrigger aria-label={field.label}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
        <SelectContent><SelectGroup>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectGroup></SelectContent>
      </Select>
    );
  }

  if (field.type === "multiselect") {
    const selected = new Set(Array.isArray(value) ? value : []);
    return (
      <div className="flex min-h-9 flex-wrap gap-1 rounded-lg border border-carbon/10 bg-white p-1">
        {field.options.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant="ghost"
            size="sm"
            className={selected.has(option.value) ? "bg-carbon/[0.07] text-carbon" : undefined}
            onClick={() => {
              const next = new Set(selected);
              if (next.has(option.value)) next.delete(option.value);
              else next.add(option.value);
              onChange(Array.from(next));
            }}
          >
            {option.label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <Input
      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
      aria-label={field.label}
      value={value === null || Array.isArray(value) ? "" : String(value)}
      onChange={(event) => {
        const next = event.target.value;
        onChange(field.type === "number" ? (next ? Number(next) : null) : next || null);
      }}
    />
  );
}

function BlurInput({
  type,
  label,
  value,
  onSave,
}: {
  type: "text" | "number" | "date";
  label: string;
  value: string;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <Input
      type={type}
      aria-label={label}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => draft !== value && onSave(draft)}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
    />
  );
}

function ColorValue({ value }: { value: string }) {
  const normalized = value.toUpperCase();
  const valid = /^#[0-9A-F]{6}$/.test(normalized);
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span
        className="size-4 shrink-0 rounded-md border border-carbon/15 shadow-inner"
        style={{ backgroundColor: valid ? normalized : "#6B6B6B" }}
        aria-hidden="true"
      />
      <span className="truncate font-mono text-[11.5px] font-semibold">
        {normalized}
      </span>
    </span>
  );
}
