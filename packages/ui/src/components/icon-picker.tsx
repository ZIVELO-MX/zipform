"use client";

import * as React from "react";
import { Check, Search } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "./popover";
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
  recentStorageKey?: string;
  onValueChange: (value: string) => void;
  className?: string;
};

export function IconPicker({ icons, value, color = "currentColor", label = "Icono", recentStorageKey = "zipform-recent-icons", onValueChange, className }: IconPickerProps) {
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
          {SelectedIcon ? <SelectedIcon aria-hidden="true" style={{ color }} /> : null}
          <span className="truncate">{selected?.label ?? `Seleccionar ${label.toLowerCase()}`}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(340px,calc(100vw-32px))]" style={{ color }}>
        <PopoverHeader>
          <PopoverTitle>Seleccionar {label.toLowerCase()}</PopoverTitle>
          <PopoverDescription>El color sigue el tipo de la tarea.</PopoverDescription>
        </PopoverHeader>
        <label className="relative block text-carbon">
          <span className="sr-only">Buscar iconos</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-carbon/40" aria-hidden="true" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar iconos…" className="pl-9" autoComplete="off" />
        </label>
        {recent.length > 0 && !query ? (
          <PickerSection title="Usados recientemente" icons={recent} value={value} onSelect={selectIcon} />
        ) : null}
        <PickerSection title={query ? "Resultados" : "Todos los iconos"} icons={filtered} value={value} onSelect={selectIcon} />
        {filtered.length === 0 ? <p className="m-0 py-6 text-center text-sm text-carbon/50">No hay iconos que coincidan.</p> : null}
      </PopoverContent>
    </Popover>
  );
}

function PickerSection({ title, icons, value, onSelect }: { title: string; icons: IconPickerOption[]; value?: string; onSelect: (id: string) => void }) {
  if (icons.length === 0) return null;
  return (
    <section className="mt-3" aria-label={title}>
      <h3 className="mb-2 mt-0 text-[10.5px] font-bold uppercase tracking-wide text-carbon/45">{title}</h3>
      <div className="grid grid-cols-5 gap-1.5">
        {icons.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className="relative grid aspect-square place-items-center rounded-xl border border-transparent bg-carbon/[0.035] transition-colors hover:border-current hover:bg-carbon/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
              aria-label={item.label}
              aria-pressed={value === item.id}
              onClick={() => onSelect(item.id)}
            >
              <Icon aria-hidden="true" />
              {value === item.id ? <Check className="absolute right-1 top-1" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
