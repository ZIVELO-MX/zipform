"use client";

import { Check, LayoutDashboard, List, Columns, Table, Calendar, SlidersHorizontal } from "lucide-react";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "@zipform/ui";
import type { TlozView } from "../../lib/tloz-routes";
import { useTlozViewState } from "./tloz-view-state";
import { CreateNewEntityButton } from "./tloz-create";

const viewConfig: Record<TlozView, { label: string; icon: React.ElementType }> = {
  dashboard: { label: "Dashboard", icon: LayoutDashboard },
  list: { label: "Lista", icon: List },
  board: { label: "Board", icon: Columns },
  table: { label: "Tabla", icon: Table },
  calendar: { label: "Calendario", icon: Calendar },
};

export function TlozControl() {
  const { state, setState, supportedViews, projects, seasons, episodes, users, showMissionControls } = useTlozViewState();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5 px-2.5 py-1 text-xs">
          <SlidersHorizontal size={12} aria-hidden="true" />
          Control
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-4">
        <PopoverHeader>
          <PopoverTitle>Control</PopoverTitle>
        </PopoverHeader>

        <ControlSection label="Vista">
          <div className="grid grid-cols-2 gap-1.5">
            {supportedViews.map((view) => {
              const cfg = viewConfig[view];
              const Icon = cfg.icon;
              const isActive = state.view === view;
              return (
                <button
                  key={view}
                  type="button"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                    isActive ? "bg-carbon/10 text-carbon" : "text-carbon/60 hover:bg-carbon/5 hover:text-carbon"
                  }`}
                  onClick={() => setState({ view: view as TlozView })}
                >
                  <Icon size={14} aria-hidden="true" />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </ControlSection>

        {showMissionControls ? (
          <>
            <Separator className="my-4" />
            <ControlSection label="Filtros">
              {projects.length > 1 ? <ControlSelect label="Proyecto" value={state.projectId} onValueChange={(projectId) => setState({ projectId })} options={[{ id: "all", name: "Todos los proyectos" }, ...projects]} /> : null}
              <ControlSelect label="Season" value={state.seasonId} onValueChange={(seasonId) => setState({ seasonId, episodeId: "all" })} options={[{ id: "all", name: "Todas las Seasons" }, ...seasons]} />
              <ControlSelect label="Episode" value={state.episodeId} onValueChange={(episodeId) => setState({ episodeId })} options={[{ id: "all", name: "Todos los Episodes" }, ...episodes.filter((episode) => state.seasonId === "all" || episode.seasonId === state.seasonId)]} />
              <ControlSelect label="Owner" value={state.ownerId} onValueChange={(ownerId) => setState({ ownerId })} options={[{ id: "all", name: "Todos los owners" }, ...users]} />
            </ControlSection>

            <Separator className="my-4" />
            <div className={state.view === "list" ? "grid grid-cols-2 gap-3" : "grid gap-3"}>
              <ControlSection label="Orden">
                <ControlSelect label="Orden" value={state.sort} onValueChange={(sort) => setState({ sort: sort as typeof state.sort })} options={[{ id: "default", name: "Predeterminado" }, { id: "due-date", name: "Fecha límite" }, { id: "title", name: "Título" }, { id: "dependencies", name: "Dependencias" }]} />
              </ControlSection>
              {state.view === "list" ? <ControlSection label="Agrupar">
                <ControlSelect label="Agrupación" value={state.grouping} onValueChange={(grouping) => setState({ grouping: grouping as typeof state.grouping })} options={[{ id: "status", name: "Estado" }, { id: "project", name: "Proyecto" }, { id: "none", name: "Sin agrupar" }]} />
              </ControlSection> : null}
            </div>

            <Separator className="my-4" />
            <label className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-carbon/5">
              Mostrar completadas
              <span className="relative grid size-5 shrink-0 place-items-center">
                <input
                  type="checkbox"
                  className="peer size-5 cursor-pointer appearance-none rounded-md border-2 border-carbon/25 bg-white transition-colors checked:border-zivelo checked:bg-zivelo"
                  checked={state.showCompleted}
                  onChange={(e) => setState({ showCompleted: e.target.checked })}
                />
                <Check className="pointer-events-none absolute size-3 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden="true" />
              </span>
            </label>
          </>
        ) : null}
        <Separator className="my-4" />
        <CreateNewEntityButton variant="control" />
      </PopoverContent>
    </Popover>
  );
}

function ControlSection({ label, children }: { label: string; children: React.ReactNode }) {
  return <section className="flex flex-col gap-2"><h3 className="m-0 text-[11px] font-bold uppercase tracking-[0.05em] text-carbon/55">{label}</h3>{children}</section>;
}

function ControlSelect({ label, value, options, onValueChange }: { label: string; value: string; options: Array<{ id: string; name: string }>; onValueChange: (value: string) => void }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent><SelectGroup>{options.map((option) => <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>)}</SelectGroup></SelectContent>
    </Select>
  );
}
