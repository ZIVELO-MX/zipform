"use client";

import { Select } from "@zipform/ui";
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
      <Select aria-label="Filtrar por proyecto" value={searchParams.get("project") ?? "all"} onChange={(event) => update("project", event.target.value)}>
        <option value="all">Todos los proyectos</option>
        {projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}
      </Select>
      <Select aria-label="Filtrar por temporada" value={searchParams.get("season") ?? "all"} onChange={(event) => update("season", event.target.value)}>
        <option value="all">Todas las Seasons</option>
        {seasons.map((season) => <option value={season.id} key={season.id}>{season.name}</option>)}
      </Select>
      <Select aria-label="Filtrar por episodio" value={searchParams.get("episode") ?? "all"} onChange={(event) => update("episode", event.target.value)}>
        <option value="all">Todos los Episodes</option>
        {episodes.map((episode) => <option value={episode.id} key={episode.id}>{episode.name}</option>)}
      </Select>
      <label className="tloz-checkbox-filter">
        <input type="checkbox" checked={searchParams.get("mine") === "1"} onChange={(event) => update("mine", event.target.checked)} />
        Solo mis Missions
      </label>
      <span className="sr-only" aria-live="polite">{pending ? "Actualizando resultados" : "Filtros actualizados"}</span>
    </fieldset>
  );
}
