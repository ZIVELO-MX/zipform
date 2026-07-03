"use client";

import { CalendarDays, KanbanSquare, LayoutDashboard, List, Table2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@zipform/ui";

type ViewOption = {
  value: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const views: ViewOption[] = [
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { value: "list", label: "Lista", icon: List },
  { value: "board", label: "Board", icon: KanbanSquare },
  { value: "table", label: "Tabla", icon: Table2 },
  { value: "calendar", label: "Calendario", icon: CalendarDays },
];

export function DisplaySwitcher() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const currentView = searchParams.get("view") || "dashboard";

  const current = views.find((v) => v.value === currentView) ?? views[0];
  const CurrentIcon = current.icon;

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "dashboard") {
        params.delete("view");
      } else {
        params.set("view", value);
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex min-h-9 items-center gap-2 rounded-[10px] border border-carbon/10 bg-paper px-3 py-1.5 text-sm font-medium text-carbon/80 transition-colors hover:bg-carbon/5 hover:text-carbon"
        >
          <CurrentIcon size={16} />
          {current.label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {views.map((view) => {
          const ViewIcon = view.icon;
          return (
            <DropdownMenuItem
              key={view.value}
              onSelect={() => handleChange(view.value)}
              className={view.value === currentView ? "bg-carbon/5 font-semibold" : ""}
            >
              <ViewIcon size={16} />
              {view.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
