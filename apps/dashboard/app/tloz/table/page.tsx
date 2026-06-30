import { TlozPageShell, TlozViewHeader } from "../../../components/tloz/tloz-shell";
import { TlozFilters } from "../../../components/tloz/tloz-filters";
import { getTlozEpisodes, getTlozMissionFilters, getTlozMissions, getTlozProjects, getTlozSeasons } from "../../../lib/tloz-data";
import { TableClient } from "./table-client";

export default async function TlozTablePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = await getTlozMissionFilters(searchParams);
  const [missions, projects, seasons, episodes] = await Promise.all([
    getTlozMissions(filters),
    getTlozProjects(),
    getTlozSeasons(),
    getTlozEpisodes()
  ]);

  return (
    <TlozPageShell title="Tabla" currentView="Tabla" showSearch>
      <TlozViewHeader title="Tabla" description={`${missions.length} missions · todas las propiedades`}>
        <TlozFilters projects={projects} seasons={seasons} episodes={episodes} />
      </TlozViewHeader>
      <div className="tloz-scrl" style={{ flex: 1, overflow: "auto", padding: "0 26px 26px" }}>
        <TableClient missions={missions} />
      </div>
    </TlozPageShell>
  );
}
