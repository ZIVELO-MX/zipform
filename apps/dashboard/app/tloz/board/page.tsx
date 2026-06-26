import { TlozFilters, TlozPageShell, TlozViewHeader } from "../../../components/tloz/tloz-shell";
import { getTlozEpisodes, getTlozMissions, getTlozProjects, getTlozSeasons } from "../../../lib/tloz-data";
import { BoardClient } from "./board-client";

export default async function TlozBoardPage() {
  const [missions, projects, seasons, episodes] = await Promise.all([
    getTlozMissions(),
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
