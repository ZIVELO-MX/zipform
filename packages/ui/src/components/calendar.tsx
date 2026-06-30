"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { cn } from "../lib/utils";

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: React.ComponentProps<typeof DayPicker>) {
  const defaults = getDefaultClassNames();
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-fit bg-paper p-2 [--rdp-accent-color:var(--zivelo-red)]", className)}
      classNames={{
        months: cn("relative flex flex-col gap-4", defaults.months),
        month: cn("flex w-full flex-col gap-3", defaults.month),
        month_caption: cn("flex h-9 items-center justify-center text-sm font-bold", defaults.month_caption),
        nav: cn("absolute inset-x-0 top-2 flex items-center justify-between", defaults.nav),
        button_previous: cn("grid size-9 place-items-center rounded-lg hover:bg-carbon/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zivelo", defaults.button_previous),
        button_next: cn("grid size-9 place-items-center rounded-lg hover:bg-carbon/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zivelo", defaults.button_next),
        month_grid: cn("w-full border-collapse", defaults.month_grid),
        weekdays: cn("flex", defaults.weekdays),
        weekday: cn("w-9 text-center text-xs font-medium text-carbon/45", defaults.weekday),
        week: cn("mt-1 flex w-full", defaults.week),
        day: cn("relative size-9 p-0 text-center", defaults.day),
        day_button: cn("size-9 rounded-lg text-sm hover:bg-carbon/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zivelo", defaults.day_button),
        selected: cn("[&>button]:bg-zivelo [&>button]:font-bold [&>button]:text-white [&>button]:hover:bg-zivelo", defaults.selected),
        today: cn("[&>button]:ring-1 [&>button]:ring-zivelo/40", defaults.today),
        outside: cn("text-carbon/30", defaults.outside),
        disabled: cn("text-carbon/25", defaults.disabled),
        hidden: cn("invisible", defaults.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => orientation === "left" ? <ChevronLeft aria-hidden="true" /> : <ChevronRight aria-hidden="true" />,
      }}
      {...props}
    />
  );
}
