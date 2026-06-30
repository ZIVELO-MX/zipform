import { TlozPageShell, TlozViewHeader } from "../../../components/tloz/tloz-shell";
import { TlozFilters } from "../../../components/tloz/tloz-filters";
import { getTlozEpisodes, getTlozMissionFilters, getTlozMissions, getTlozProjects, getTlozSeasons } from "../../../lib/tloz-data";
import { BoardClient } from "./board-client";

export default async function TlozBoardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = await getTlozMissionFilters(searchParams);
  const [missions, projects, seasons, episodes] = await Promise.all([
    getTlozMissions(filters),
    getTlozProjects(),
    getTlozSeasons(),
    getTlozEpisodes()
  ]);

  return (
    <TlozPageShell title="Board" currentView="Board" showSearch fullWidth>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TlozViewHeader title="Board" description="Flujo de trabajo del equipo · agrupado por estado" showAudienceToggle>
          <TlozFilters projects={projects} seasons={seasons} episodes={episodes} />
        </TlozViewHeader>
        <div style={{ flex: 1, padding: "4px 26px 26px" }}>
          <BoardClient missions={missions} />
        </div>
      </div>
    </TlozPageShell>
  );
}
