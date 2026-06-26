import { TlozFilters, TlozPageShell, TlozViewHeader } from "../../../components/tloz/tloz-shell";
import { getTlozEpisodes, getTlozMissions, getTlozProjects, getTlozSeasons } from "../../../lib/tloz-data";
import { ListClient } from "./list-client";

export default async function TlozListPage() {
  const [missions, projects, seasons, episodes] = await Promise.all([
    getTlozMissions(),
    getTlozProjects(),
    getTlozSeasons(),
    getTlozEpisodes()
  ]);

  return (
    <TlozPageShell title="Lista" currentView="Lista" showSearch>
      <TlozViewHeader title="Lista" description="Todas las missions · agrupadas por estado">
        <TlozFilters projects={projects} seasons={seasons} episodes={episodes} />
      </TlozViewHeader>
      <div className="tloz-scrl" style={{ flex: 1, overflow: "auto", padding: "4px 26px 48px" }}>
        <ListClient missions={missions} />
      </div>
    </TlozPageShell>
  );
}
