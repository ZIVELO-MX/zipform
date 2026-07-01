"use client";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@zipform/ui";
import type { TlozEpisode, TlozProject, TlozSeason } from "@zipform/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function TlozFilters({ projects, seasons, episodes }: { projects: TlozProject[]; seasons: TlozSeason[]; episodes: TlozEpisode[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(name: string, value: string | boolean) {
    const params = new URLSearchParams(searchParams);
    if (value === "all" || value === false) params.delete(name);
    else params.set(name, value === true ? "1" : value);
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  return (
    <fieldset className="tloz-filters" aria-busy={pending} disabled={pending}>
      <legend className="sr-only">Filtrar missions</legend>
      <FilterSelect label="Filtrar por proyecto" value={searchParams.get("project") ?? "all"} allLabel="Todos los proyectos" options={projects} onChange={(value) => update("project", value)} />
      <FilterSelect label="Filtrar por temporada" value={searchParams.get("season") ?? "all"} allLabel="Todas las Seasons" options={seasons} onChange={(value) => update("season", value)} />
      <FilterSelect label="Filtrar por episodio" value={searchParams.get("episode") ?? "all"} allLabel="Todos los Episodes" options={episodes} onChange={(value) => update("episode", value)} />
      <label className="tloz-checkbox-filter">
        <input type="checkbox" checked={searchParams.get("mine") === "1"} onChange={(event) => update("mine", event.target.checked)} />
        Solo mis Missions
      </label>
      <span className="sr-only" aria-live="polite">{pending ? "Actualizando resultados" : "Filtros actualizados"}</span>
    </fieldset>
  );
}

function FilterSelect({ label, value, allLabel, options, onChange }: { label: string; value: string; allLabel: string; options: Array<{ id: string; name: string }>; onChange: (value: string) => void }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label}><SelectValue /></SelectTrigger><SelectContent position="item-aligned"><SelectGroup><SelectItem value="all">{allLabel}</SelectItem>{options.map((option) => <SelectItem value={option.id} key={option.id}>{option.name}</SelectItem>)}</SelectGroup></SelectContent></Select>;
}
