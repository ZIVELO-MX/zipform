"use client";

import * as React from "react";
import { Check, Pipette } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "./popover";
import { cn } from "../lib/utils";

export const TLOZ_COLOR_PALETTE = ["#D72228", "#B91C22", "#2D6CDF", "#3A47B5", "#1E8E5A", "#2F7D4F", "#7A4ED9", "#8A6F2A", "#D97706", "#6B6B6B"] as const;

export function ColorPicker({ value, onValueChange, label = "Color", palette = TLOZ_COLOR_PALETTE, className }: {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  palette?: readonly string[];
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value.toUpperCase());
  React.useEffect(() => setDraft(value.toUpperCase()), [value]);
  const valid = /^#[0-9A-F]{6}$/i.test(draft);
  function commit(next: string) { const normalized = next.toUpperCase(); setDraft(normalized); onValueChange(normalized); }

  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><Button type="button" variant="outline" className={cn("w-full justify-start", className)} aria-label={`Seleccionar ${label.toLowerCase()}`}><span className="size-4 shrink-0 rounded-full border border-carbon/10 shadow-inner" style={{ backgroundColor: value }} /><span className="font-mono text-xs">{value.toUpperCase()}</span></Button></PopoverTrigger>
    <PopoverContent className="w-[min(320px,calc(100vw-32px))] p-4">
      <PopoverHeader><PopoverTitle>{label}</PopoverTitle></PopoverHeader>
      <div className="grid grid-cols-5 gap-2" aria-label="Paleta TLOZ">{palette.map((color) => <button key={color} type="button" className="relative aspect-square rounded-xl border border-carbon/10 shadow-sm transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-carbon/30" style={{ backgroundColor: color }} aria-label={color} aria-pressed={value.toUpperCase() === color.toUpperCase()} onClick={() => commit(color)}>{value.toUpperCase() === color.toUpperCase() ? <Check className="absolute inset-0 m-auto size-4 text-white drop-shadow" strokeWidth={3} /> : null}</button>)}</div>
      <div className="mt-4 grid grid-cols-[44px_1fr_auto] gap-2">
        <label className="relative grid size-11 cursor-pointer place-items-center overflow-hidden rounded-xl border border-carbon/15 bg-white" aria-label="Abrir selector visual"><Pipette className="pointer-events-none size-4" /><input type="color" className="absolute inset-0 cursor-pointer opacity-0" value={valid ? draft : value} onChange={(event) => commit(event.target.value)} /></label>
        <Input className="font-mono uppercase" value={draft} aria-label="Color hexadecimal" aria-invalid={!valid} maxLength={7} onChange={(event) => setDraft(event.target.value.toUpperCase())} onKeyDown={(event) => { if (event.key === "Enter" && valid) commit(draft); }} />
        <Button type="button" size="sm" disabled={!valid || draft.toUpperCase() === value.toUpperCase()} onClick={() => commit(draft)}>Aplicar</Button>
      </div>
      {!valid ? <p className="mb-0 mt-2 text-xs font-medium text-[#B91C22]">Usa un valor HEX de seis dígitos, por ejemplo #D72228.</p> : null}
    </PopoverContent>
  </Popover>;
}
