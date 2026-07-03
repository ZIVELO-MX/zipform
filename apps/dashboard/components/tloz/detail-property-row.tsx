"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@zipform/ui";

export function DetailPropertyRow({ label, display, children, readOnly = false }: {
  label: string;
  display: React.ReactNode;
  children: React.ReactNode;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (readOnly) return <div className="grid min-h-10 w-full grid-cols-[88px_minmax(0,1fr)] items-center gap-2.5 px-2"><span className="text-xs font-medium text-[#9A9A98]">{label}</span><span className="min-w-0 truncate text-[12.5px] font-semibold text-[#1D1D1B]">{display}</span></div>;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="grid min-h-10 w-full grid-cols-[88px_minmax(0,1fr)] items-center gap-2.5 rounded-lg px-2 text-left transition-colors hover:bg-[#F7F7F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1D1D1B]/20">
          <span className="text-xs font-medium text-[#9A9A98]">{label}</span>
          <span className="min-w-0 truncate text-[12.5px] font-semibold text-[#1D1D1B]">{display}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-4"
        align="start"
        onPointerDownOutside={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("[data-radix-popper-content-wrapper]") || target.closest("[data-radix-menu-content]") || target.closest("[data-radix-select-content]")) event.preventDefault();
        }}
      >
        <label className="mb-3 block text-xs font-medium text-[#9A9A98]">{label}</label>
        {children}
      </PopoverContent>
    </Popover>
  );
}
