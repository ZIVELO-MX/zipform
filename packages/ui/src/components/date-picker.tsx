"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "./popover";
import { cn } from "../lib/utils";

export function DatePicker({ value, onValueChange, label = "Fecha", placeholder = "Seleccionar fecha", clearable = true, className }: {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  label?: string;
  placeholder?: string;
  clearable?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = value ? new Date(`${value.slice(0, 10)}T12:00:00`) : undefined;
  const formatted = selected ? new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(selected) : placeholder;

  function selectDate(date: Date | undefined) {
    if (!date) return;
    const next = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    onValueChange(next);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <span className={cn("flex items-center gap-1.5", className)}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="min-w-0 flex-1 justify-start" aria-label={`Seleccionar ${label.toLowerCase()}`}>
            <span className="truncate">{formatted}</span>
          </Button>
        </PopoverTrigger>
        {value && clearable ? (
          <Button type="button" variant="ghost" size="icon" aria-label={`Quitar ${label.toLowerCase()}`} onClick={() => onValueChange(undefined)}>
            <X aria-hidden="true" />
          </Button>
        ) : null}
      </span>
      <PopoverContent className="w-auto p-2">
        <PopoverHeader className="px-2 pt-1">
          <PopoverTitle>{label}</PopoverTitle>
          <PopoverDescription>Selecciona una fecha del calendario.</PopoverDescription>
        </PopoverHeader>
        <Calendar mode="single" selected={selected} onSelect={selectDate} />
      </PopoverContent>
    </Popover>
  );
}
