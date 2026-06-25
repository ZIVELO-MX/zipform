import Link from "next/link";
import { Plus, Search } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Input,
  Select
} from "@zipform/ui";
import type { TlozEpisode, TlozProject, TlozSeason } from "@zipform/types";

type TlozPageShellProps = {
  title: string;
  description: string;
  currentView?: string;
  children: React.ReactNode;
  detailLabel?: string;
  showSearch?: boolean;
};

export function TlozPageShell({
  title,
  description,
  currentView,
  detailLabel,
  showSearch = true,
  children
}: TlozPageShellProps) {
  const showBreadcrumbs = Boolean(detailLabel || (currentView && currentView !== "Dashboard"));

  return (
    <div className="page-stack tloz-page">
      {showBreadcrumbs ? (
        <Breadcrumb>
          <BreadcrumbList className="text-carbon/60">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/tloz">TLOZ</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {currentView && currentView !== "Dashboard" ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentView}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : null}
            {detailLabel ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{detailLabel}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : null}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}

      <section className="page-header tloz-header">
        <div>
          <p className="eyebrow">The Legend of Zivelo</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="tloz-header-actions">
          {showSearch ? (
            <div className="tloz-header-search">
              <Search size={16} />
              <Input placeholder="Buscar missions, proyectos, quest items..." aria-label="Buscar en TLOZ" />
              <kbd>⌘K</kbd>
            </div>
          ) : null}
          <Button disabled title="Pendiente: crear Missions con persistencia">
            <Plus size={16} />
            Nueva Mission
          </Button>
        </div>
      </section>

      {children}
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
