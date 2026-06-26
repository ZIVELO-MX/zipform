import { Select } from "@zipform/ui";
import type { TlozEpisode, TlozProject, TlozSeason } from "@zipform/types";
import { TlozHeader } from "./tloz-header";

type TlozPageShellProps = {
  title: string;
  description?: string;
  currentView?: string;
  children: React.ReactNode;
  detailLabel?: string;
  showSearch?: boolean;
  showHeader?: boolean;
};

export function TlozPageShell({
  title,
  description,
  currentView,
  detailLabel,
  showSearch = true,
  showHeader = true,
  children
}: TlozPageShellProps) {
  return (
    <div className="page-stack tloz-page">
      <TlozHeader
        title={title}
        currentView={currentView}
        detailLabel={detailLabel}
        showSearch={showSearch}
        showHeader={showHeader}
      />

      {children}
    </div>
  );
}

export function TlozSubpageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ padding: "18px 26px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: "21px", fontWeight: 700, letterSpacing: "-0.02em" }}>{title}</h1>
        <p style={{ margin: "4px 0 0", color: "#6B6B6B", fontSize: "13px" }}>{description}</p>
      </div>
    </div>
  );
}

export function TlozFilters({
  projects,
  seasons,
  episodes
}: {
  projects: TlozProject[];
  seasons: TlozSeason[];
  episodes: TlozEpisode[];
}) {
  return (
    <section className="tloz-filters" aria-label="Filtros TLOZ">
      <Select aria-label="Filtrar por proyecto" defaultValue="all">
        <option value="all">Todos los proyectos</option>
        {projects.map((project) => (
          <option value={project.id} key={project.id}>
            {project.name}
          </option>
        ))}
      </Select>
      <Select aria-label="Filtrar por temporada" defaultValue="all">
        <option value="all">Todas las Seasons</option>
        {seasons.map((season) => (
          <option value={season.id} key={season.id}>
            {season.name}
          </option>
        ))}
      </Select>
      <Select aria-label="Filtrar por episodio" defaultValue="all">
        <option value="all">Todos los Episodes</option>
        {episodes.map((episode) => (
          <option value={episode.id} key={episode.id}>
            {episode.name}
          </option>
        ))}
      </Select>
      <label className="tloz-checkbox-filter">
        <input type="checkbox" />
        Solo mis Missions
      </label>
    </section>
  );
}
