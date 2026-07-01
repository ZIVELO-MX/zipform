"use client";

import { cn } from "../lib/utils";

export type SegmentedControlOption = {
  label: string;
  value: string;
};

export function SegmentedControl({ options, value, onValueChange, "aria-label": ariaLabel = "View selector" }: {
  options: SegmentedControlOption[];
  value: string;
  onValueChange?: (value: string) => void;
  "aria-label"?: string;
}) {
  return <div className="inline-flex gap-0.5 rounded-full bg-carbon/5 p-0.5" role="group" aria-label={ariaLabel}>
    {options.map((option) => <button
      key={option.value}
      type="button"
      className={cn("rounded-full px-3 py-1.5 text-xs font-medium text-carbon/65 transition-colors", option.value === value && "bg-white font-semibold text-carbon shadow-[0_1px_2px_rgba(29,29,27,0.07)]")}
      aria-pressed={option.value === value}
      onClick={() => onValueChange?.(option.value)}
    >{option.label}</button>)}
  </div>;
}
