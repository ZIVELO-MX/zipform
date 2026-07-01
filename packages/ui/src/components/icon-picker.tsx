"use client";

import * as React from "react";
import { FileText, Search, X } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "./popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { cn } from "../lib/utils";

export type IconPickerOption = {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

export type IconPickerProps = {
  icons: IconPickerOption[];
  value?: string;
  color?: string;
  label?: string;
  triggerLabel?: string;
  recentStorageKey?: string;
  onValueChange: (value: string) => void;
  allowClear?: boolean;
  iconOnly?: boolean;
  className?: string;
};

export function IconPicker({ icons, value, color = "currentColor", label = "Icono", triggerLabel, recentStorageKey = "zipform-recent-icons", onValueChange, allowClear = false, iconOnly = false, className }: IconPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [recentIds, setRecentIds] = React.useState<string[]>([]);
  const selected = icons.find((item) => item.id === value);

  React.useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(recentStorageKey) ?? "[]");
      if (Array.isArray(stored)) setRecentIds(stored.filter((item): item is string => typeof item === "string").slice(0, 4));
    } catch {
      setRecentIds([]);
    }
  }, [recentStorageKey]);

  const filtered = icons.filter((item) => item.label.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")));
  const recent = recentIds.map((id) => icons.find((item) => item.id === id)).filter((item): item is IconPickerOption => Boolean(item));

  function selectIcon(id: string) {
    const nextRecent = [id, ...recentIds.filter((item) => item !== id)].slice(0, 4);
    setRecentIds(nextRecent);
    try {
      window.localStorage.setItem(recentStorageKey, JSON.stringify(nextRecent));
    } catch {
      // The picker remains functional when storage is unavailable.
    }
    onValueChange(id);
    setOpen(false);
    setQuery("");
  }

  const SelectedIcon = selected?.icon;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className={cn("w-full justify-start", className)} aria-label={`Seleccionar ${label.toLowerCase()}`}>
          {SelectedIcon ? <SelectedIcon className="size-3.5" aria-hidden="true" style={{ color }} /> : <FileText className="size-3.5" aria-hidden="true" style={{ color }} />}
          {!iconOnly ? <span className="truncate">{triggerLabel ?? selected?.label ?? `Seleccionar ${label.toLowerCase()}`}</span> : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(340px,calc(100vw-32px))]" style={{ color }}>
        <PopoverHeader>
          <PopoverTitle>Seleccionar {label.toLowerCase()}</PopoverTitle>
        </PopoverHeader>
        <label className="relative block text-carbon">
          <span className="sr-only">Buscar iconos</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-carbon/40" aria-hidden="true" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar iconos…" className="pl-9" autoComplete="off" />
        </label>
        {recent.length > 0 && !query ? (
          <PickerSection title="Usados recientemente" icons={recent} value={value} onSelect={selectIcon} />
        ) : null}
        <PickerSection title={query ? "Resultados" : "Todos los iconos"} icons={filtered} value={value} onSelect={selectIcon} />
        {filtered.length === 0 ? <p className="m-0 py-6 text-center text-sm text-carbon/50">No hay iconos que coincidan.</p> : null}
        {allowClear && value ? <Button type="button" variant="ghost" className="mt-2 w-full justify-start text-carbon/55" onClick={() => { onValueChange(""); setOpen(false); }}><X data-icon="inline-start" aria-hidden="true" />Eliminar icono</Button> : null}
      </PopoverContent>
    </Popover>
  );
}

function PickerSection({ title, icons, value, onSelect }: { title: string; icons: IconPickerOption[]; value?: string; onSelect: (id: string) => void }) {
  if (icons.length === 0) return null;
  return (
    <section className="mt-2" aria-label={title}>
      <h3 className="mb-1.5 mt-0 text-[10.5px] font-bold uppercase tracking-wide text-carbon/45">{title}</h3>
      <div className="grid grid-cols-6 gap-1">
        {icons.map((item) => {
          const Icon = item.icon;
          return (
            <Tooltip key={item.id}><TooltipTrigger asChild><button
              type="button"
              className="grid aspect-square place-items-center rounded-md border border-transparent transition-colors hover:border-carbon/15 hover:bg-carbon/[0.035] focus-visible:outline focus-visible:outline-2 focus-visible:outline-carbon/20"
              aria-label={item.label}
              aria-pressed={value === item.id}
              onClick={() => onSelect(item.id)}
            ><Icon className="size-3.5" aria-hidden="true" /></button></TooltipTrigger><TooltipContent>{item.label}</TooltipContent></Tooltip>
          );
        })}
      </div>
    </section>
  );
}
