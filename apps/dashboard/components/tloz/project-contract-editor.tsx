"use client";

import { useEffect, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Button,
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
  TlozDocumentScalar,
  TlozFieldDefinition,
  TlozFieldOption,
  TlozFieldType,
  TlozStatusRole,
} from "@tloz/types";
import { replaceProjectContract } from "../../app/tloz/actions";
import { normalizeFieldPositions } from "./project-contract";

const fieldTypeLabel: Record<TlozFieldType, string> = {
  text: "Texto",
  number: "Número",
  boolean: "Boolean",
  date: "Fecha",
  select: "Select",
  multiselect: "Multiselect",
  person: "Persona",
  relation: "Relación",
};
const statusRoleLabel: Record<TlozStatusRole, string> = {
  backlog: "Backlog",
  ready: "Ready",
  active: "Active",
  blocked: "Blocked",
  done: "Done",
};

export function ProjectContractEditor({ document }: { document: TlozDocument }) {
  const [current, setCurrent] = useState(document);
  const [fields, setFields] = useState(() => normalizeFieldPositions(document.contract?.fields ?? []));
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const toasterId = useOverlayToasterId();

  useEffect(() => {
    setCurrent(document);
    setFields(normalizeFieldPositions(document.contract?.fields ?? []));
    setDirty(false);
  }, [document]);

  function change(index: number, update: Partial<TlozFieldDefinition>) {
    setFields((values) => normalizeFieldPositions(values.map((field, fieldIndex) => (
      fieldIndex === index ? { ...field, ...update } : field
    ))));
    setDirty(true);
  }

  function move(index: number, offset: -1 | 1) {
    const target = index + offset;
    if (target < 0 || target >= fields.length) return;
    setFields((values) => {
      const next = [...values];
      [next[index], next[target]] = [next[target], next[index]];
      return normalizeFieldPositions(next);
    });
    setDirty(true);
  }

  function remove(index: number) {
    setFields((values) => normalizeFieldPositions(values.filter((_, fieldIndex) => fieldIndex !== index)));
    setDirty(true);
  }

  function add() {
    const key = nextFieldKey(fields);
    setFields((values) => normalizeFieldPositions([
      ...values,
      {
        id: `draft-${crypto.randomUUID()}`,
        key,
        label: "Nuevo campo",
        type: "text",
        required: false,
        visible: true,
        position: values.length,
        options: [],
      },
    ]));
    setDirty(true);
  }

  function save() {
    const toastId = toast.loading("Guardando contrato…", { toasterId });
    startTransition(async () => {
      try {
        const updated = await replaceProjectContract(current.id, fields, current.revision);
        setCurrent(updated);
        setFields(normalizeFieldPositions(updated.contract?.fields ?? []));
        setDirty(false);
        toast.success("Contrato actualizado", { id: toastId, toasterId });
      } catch {
        toast.error("No se pudo guardar el contrato", { id: toastId, toasterId });
      }
    });
  }

  return (
    <section className="mx-auto mb-10 w-full max-w-[1052px] px-[26px]" aria-labelledby="project-contract-title">
      <div className="overflow-hidden rounded-2xl border border-carbon/10 bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-carbon/[0.07] px-4 py-3">
          <div>
            <h2 id="project-contract-title" className="m-0 text-[13px] font-bold text-carbon">
              Contrato de Missions
            </h2>
            <p className="m-0 mt-0.5 text-[11px] font-medium text-carbon/45">
              Orden, requisitos, visibilidad, defaults y opciones.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={add}>
              <Plus aria-hidden="true" />
              Campo
            </Button>
            <Button type="button" size="sm" disabled={!dirty || pending} onClick={save}>
              Guardar
            </Button>
          </div>
        </header>

        <div className="divide-y divide-carbon/[0.07]">
          {fields.map((field, index) => (
            <FieldRow
              key={field.id}
              field={field}
              index={index}
              count={fields.length}
              onChange={(update) => change(index, update)}
              onMove={(offset) => move(index, offset)}
              onRemove={() => remove(index)}
            />
          ))}
          {fields.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] font-medium text-carbon/45">
              Este Project no exige campos adicionales.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function FieldRow({ field, index, count, onChange, onMove, onRemove }: {
  field: TlozFieldDefinition;
  index: number;
  count: number;
  onChange: (update: Partial<TlozFieldDefinition>) => void;
  onMove: (offset: -1 | 1) => void;
  onRemove: () => void;
}) {
  const selectable = field.type === "select" || field.type === "multiselect";
  const coreField = field.key === "status" || field.key === "category";
  return (
    <article className="grid gap-3 px-4 py-3 lg:grid-cols-[56px_minmax(12rem,1fr)_148px_172px_76px] lg:items-start">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={index === 0}
          aria-label={`Subir ${field.label}`}
          onClick={() => onMove(-1)}
        >
          <ArrowUp aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={index === count - 1}
          aria-label={`Bajar ${field.label}`}
          onClick={() => onMove(1)}
        >
          <ArrowDown aria-hidden="true" />
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Labeled label="Etiqueta">
          <Input
            value={field.label}
            aria-label={`Etiqueta de ${field.key}`}
            onChange={(event) => onChange({ label: event.target.value })}
          />
        </Labeled>
        <Labeled label="Key">
          <Input
            value={field.key}
            aria-label={`Key de ${field.label}`}
            disabled={isPersistedField(field)}
            onChange={(event) => onChange({ key: normalizeKey(event.target.value) })}
          />
        </Labeled>
        <div className="sm:col-span-2">
          <DefaultEditor field={field} onChange={(defaultValue) => onChange({ defaultValue })} />
        </div>
        {selectable ? (
          <div className="sm:col-span-2">
            <OptionEditor
              field={field}
              onChange={(options) => onChange({ options })}
            />
          </div>
        ) : null}
      </div>

      <Labeled label="Tipo">
        <Select
          value={field.type}
          disabled={coreField}
          onValueChange={(value) => {
            const type = value as TlozFieldType;
            onChange({
              type,
              options: type === "select" || type === "multiselect"
                ? field.options.length ? field.options : [{ value: "option", label: "Opción" }]
                : [],
              defaultValue: undefined,
            });
          }}
        >
          <SelectTrigger aria-label={`Tipo de ${field.label}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.entries(fieldTypeLabel).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Labeled>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-carbon/40">Reglas</span>
        <RuleButton
          active={field.required}
          label={field.required ? "Requerido" : "Opcional"}
          onClick={() => onChange({ required: !field.required })}
        />
        <RuleButton
          active={field.visible}
          label={field.visible ? "Visible" : "Oculto"}
          icon={field.visible ? Eye : EyeOff}
          onClick={() => onChange({ visible: !field.visible })}
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-carbon/40 hover:text-[#B91C22]"
          aria-label={`Retirar ${field.label}`}
          disabled={field.key === "status" || field.key === "category"}
          onClick={onRemove}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
}

function DefaultEditor({ field, onChange }: {
  field: TlozFieldDefinition;
  onChange: (value: TlozDocumentScalar | undefined) => void;
}) {
  if (field.type === "boolean") {
    return (
      <Labeled label="Default">
        <Select
          value={typeof field.defaultValue === "boolean" ? String(field.defaultValue) : "none"}
          onValueChange={(value) => onChange(value === "none" ? undefined : value === "true")}
        >
          <SelectTrigger aria-label={`Default de ${field.label}`}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin default</SelectItem>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      </Labeled>
    );
  }
  if (field.type === "select") {
    return (
      <Labeled label="Default">
        <Select
          value={typeof field.defaultValue === "string" ? field.defaultValue : "none"}
          onValueChange={(value) => onChange(value === "none" ? undefined : value)}
        >
          <SelectTrigger aria-label={`Default de ${field.label}`}><SelectValue placeholder="Sin default" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin default</SelectItem>
            {field.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Labeled>
    );
  }
  if (field.type === "multiselect" || field.type === "person" || field.type === "relation") return null;
  return (
    <Labeled label="Default">
      <Input
        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
        value={typeof field.defaultValue === "string" || typeof field.defaultValue === "number" ? field.defaultValue : ""}
        aria-label={`Default de ${field.label}`}
        onChange={(event) => {
          if (!event.target.value) onChange(undefined);
          else onChange(field.type === "number" ? Number(event.target.value) : event.target.value);
        }}
      />
    </Labeled>
  );
}

function OptionEditor({ field, onChange }: {
  field: TlozFieldDefinition;
  onChange: (options: TlozFieldOption[]) => void;
}) {
  const showRole = field.key === "status";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-carbon/40">Opciones</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-7 px-2 text-xs"
          onClick={() => onChange([...field.options, {
            value: nextOptionKey(field.options),
            label: "Opción",
            ...(showRole ? { role: "backlog" as const } : {}),
          }])}
        >
          <Plus aria-hidden="true" />
          Opción
        </Button>
      </div>
      <div className="space-y-1.5">
        {field.options.map((option, index) => (
          <div key={`${option.value}-${index}`} className={`grid gap-1.5 ${showRole ? "grid-cols-[1fr_1fr_110px_28px]" : "grid-cols-[1fr_1fr_28px]"}`}>
            <Input
              value={option.value}
              aria-label={`Valor de opción ${index + 1}`}
              onChange={(event) => onChange(replaceOption(field.options, index, { value: normalizeKey(event.target.value) }))}
            />
            <Input
              value={option.label}
              aria-label={`Etiqueta de opción ${index + 1}`}
              onChange={(event) => onChange(replaceOption(field.options, index, { label: event.target.value }))}
            />
            {showRole ? (
              <Select
                value={option.role ?? "backlog"}
                onValueChange={(role) => onChange(replaceOption(field.options, index, { role: role as TlozStatusRole }))}
              >
                <SelectTrigger aria-label={`Rol de ${option.label}`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusRoleLabel).map(([role, label]) => (
                    <SelectItem key={role} value={role}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Quitar opción ${option.label}`}
              onClick={() => onChange(field.options.filter((_, optionIndex) => optionIndex !== index))}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-carbon/40">{label}</span>
      {children}
    </label>
  );
}

function RuleButton({ active, label, icon: Icon, onClick }: {
  active: boolean;
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-left text-[11px] font-semibold transition-colors ${
        active ? "bg-carbon/[0.07] text-carbon" : "text-carbon/45 hover:bg-carbon/[0.04]"
      }`}
      aria-pressed={active}
      onClick={onClick}
    >
      {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : <span className="size-2 rounded-full bg-current" />}
      {label}
    </button>
  );
}

function replaceOption(options: TlozFieldOption[], index: number, update: Partial<TlozFieldOption>) {
  return options.map((option, optionIndex) => optionIndex === index ? { ...option, ...update } : option);
}

function normalizeKey(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+/, "");
}

function nextFieldKey(fields: TlozFieldDefinition[]) {
  let index = fields.length + 1;
  while (fields.some((field) => field.key === `field_${index}`)) index += 1;
  return `field_${index}`;
}

function nextOptionKey(options: TlozFieldOption[]) {
  let index = options.length + 1;
  while (options.some((option) => option.value === `option_${index}`)) index += 1;
  return `option_${index}`;
}

function isPersistedField(field: TlozFieldDefinition) {
  return !field.id.startsWith("draft-");
}
