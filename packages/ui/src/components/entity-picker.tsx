"use client";

import * as React from "react";
import { ChevronsUpDown, FileText, Plus, Search, X } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "./popover";
import { Separator } from "./separator";
import { cn } from "../lib/utils";

export type EntityPickerOption = {
  id: string;
  name: string;
  description?: string;
  iconComponent?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconColor?: string;
  iconBackground?: string;
  color?: string;
};

export function EntityPicker({ options, value, onValueChange, onCreate, label, triggerLabel, triggerVariant = "outline", disabled, allowEmpty = true, className }: {
  options: EntityPickerOption[];
  value?: string;
  onValueChange: (value: string) => void;
  onCreate?: (name: string) => Promise<EntityPickerOption>;
  label: string;
  triggerLabel?: string;
  triggerVariant?: "outline" | "ghost";
  disabled?: boolean;
  allowEmpty?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const selected = options.find((option) => option.id === value);
  const SelectedIcon = selected?.iconComponent ?? FileText;
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const filtered = options.filter((option) => `${option.name} ${option.description ?? ""}`.toLocaleLowerCase("es").includes(normalizedQuery));
  const exactMatch = options.some((option) => option.name.toLocaleLowerCase("es") === normalizedQuery);

  async function create() {
    if (!onCreate || !query.trim()) return;
    setCreating(true);
    try { const option = await onCreate(query.trim()); onValueChange(option.id); setOpen(false); setQuery(""); }
    finally { setCreating(false); }
  }

  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><Button type="button" variant={triggerVariant} disabled={disabled} className={cn("w-full justify-between font-semibold [&_svg]:size-3.5", className)} aria-label={`Seleccionar ${label.toLocaleLowerCase("es")}`}><span className="flex min-w-0 items-center gap-2">{selected ? selected.color ? <span className="size-[7px] shrink-0 rounded-full" style={{ backgroundColor: selected.color }} /> : <span className="grid size-6 shrink-0 place-items-center rounded-md" style={{ color: selected.iconColor ?? "#6B6B6B", backgroundColor: selected.iconBackground ?? "#F0EFED" }}><SelectedIcon aria-hidden="true" /></span> : null}<span className="truncate">{triggerLabel ?? selected?.name ?? `Sin ${label.toLocaleLowerCase("es")}`}</span></span><ChevronsUpDown aria-hidden="true" /></Button></PopoverTrigger>
    <PopoverContent className="w-[min(360px,calc(100vw-32px))]">
      <PopoverHeader><PopoverTitle>{label}</PopoverTitle></PopoverHeader>
      <label className="relative block"><span className="sr-only">Buscar {label.toLocaleLowerCase("es")}</span><Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-carbon/40" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && onCreate && filtered.length === 0) { event.preventDefault(); void create(); } }} placeholder={`Buscar ${label.toLocaleLowerCase("es")}…`} className="pl-9" autoComplete="off" /></label>
      <div className="mt-2 flex max-h-64 flex-col gap-1 overflow-y-auto overscroll-contain">
        {allowEmpty ? <button type="button" className="flex min-h-10 items-center gap-2 rounded-lg px-2.5 text-left text-sm text-carbon/55 hover:bg-carbon/5" onClick={() => { onValueChange(""); setOpen(false); setQuery(""); }}><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-carbon/5"><X className="size-3.5" aria-hidden="true" /></span>Sin {label.toLocaleLowerCase("es")}</button> : null}
        {allowEmpty && filtered.length ? <Separator /> : null}
        {filtered.map((option) => { const OptionIcon = option.iconComponent ?? FileText; return <button key={option.id} type="button" className="flex min-h-11 items-center gap-3 rounded-xl px-2.5 text-left hover:bg-carbon/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-carbon/20" aria-pressed={value === option.id} onClick={() => { onValueChange(option.id); setOpen(false); setQuery(""); }}>{option.color ? <span className="grid size-7 shrink-0 place-items-center"><span className="size-[7px] rounded-full" style={{ backgroundColor: option.color }} /></span> : <span className="grid size-7 shrink-0 place-items-center rounded-lg [&_svg]:size-3.5" style={{ color: option.iconColor ?? "#6B6B6B", backgroundColor: option.iconBackground ?? "#F0EFED" }}><OptionIcon aria-hidden="true" /></span>}<span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{option.name}</span></button>; })}
        {!filtered.length && !onCreate ? <p className="m-0 py-5 text-center text-sm text-carbon/50">No hay resultados.</p> : null}
      </div>
      {onCreate && query.trim() && !exactMatch ? <><Separator className="my-2" /><Button type="button" variant="ghost" className="w-full justify-start" disabled={creating} onClick={() => void create()}><Plus data-icon="inline-start" aria-hidden="true" />{creating ? "Creando…" : `Crear “${query.trim()}”`}</Button></> : null}
    </PopoverContent>
  </Popover>;
}
