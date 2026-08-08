"use client";

import { DatePicker, Input, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, UserPicker } from "@tloz/ui";
import type { ContainerContentData, ContainerDefinition, UserProfile } from "@tloz/types";

export type ContainerField = ContainerDefinition["fields"][number];

export function ContainerContentField({
  field,
  value,
  users,
  onChange,
}: {
  field: ContainerField;
  value: ContainerContentData | undefined;
  users: UserProfile[];
  onChange: (value: ContainerContentData) => void;
}) {
  const text = scalarText(value);
  const options = field.options ?? [];

  if (field.format === "person") {
    return (
      <UserPicker
        users={users}
        value={text || undefined}
        allowEmpty={!field.required}
        emptyLabel="Sin responsable"
        label={field.label}
        onValueChange={(next) => onChange(next || null)}
      />
    );
  }

  if (field.format === "date") {
    return (
      <DatePicker
        value={text || undefined}
        label={field.label}
        onValueChange={(next) => onChange(next ?? null)}
      />
    );
  }

  if (options.length > 0) {
    return (
      <Select value={text || undefined} onValueChange={onChange}>
        <SelectTrigger aria-label={field.label}><SelectValue placeholder={`Seleccionar ${field.label.toLowerCase()}`} /></SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      aria-label={field.label}
      type={field.format === "number" ? "number" : "text"}
      value={text}
      onChange={(event) => onChange(field.format === "number"
        ? event.target.value === "" ? null : Number(event.target.value)
        : event.target.value)}
    />
  );
}

export function scalarText(value: ContainerContentData | undefined) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}
