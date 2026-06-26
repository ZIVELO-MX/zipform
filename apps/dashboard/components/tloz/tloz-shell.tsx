import { PageSubHeader, SegmentedControl, Select } from "@zipform/ui";
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
  fullWidth?: boolean;
};

export function TlozPageShell({
  title,
  description,
  currentView,
  detailLabel,
  showSearch = true,
  showHeader = true,
  fullWidth = false,
  children
}: TlozPageShellProps) {
  return (
    <div className={fullWidth ? "tloz-page-full" : "page-stack tloz-page"}>
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
  return <PageSubHeader title={title} description={description} />;
}

export function TlozViewHeader({
  title,
  description,
  children,
  showAudienceToggle = false
}: {
  title: string;
  description: React.ReactNode;
  children?: React.ReactNode;
  showAudienceToggle?: boolean;
}) {
  return (
    <PageSubHeader
      title={title}
      description={description}
      actions={
        <>
          {showAudienceToggle ? (
            <SegmentedControl
              aria-label="Filtrar por audiencia"
              value="team"
              options={[
                { label: "Todo el equipo", value: "team" },
                { label: "Solo yo", value: "me" },
              ]}
            />
          ) : null}
          {children}
        </>
      }
    />
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
