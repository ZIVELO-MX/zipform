import { MissionBoard } from "../../../components/tloz/mission-views";
import { TlozFilters, TlozPageShell } from "../../../components/tloz/tloz-shell";
import { getTlozEpisodes, getTlozMissions, getTlozProjects, getTlozSeasons } from "../../../lib/tloz-data";

export default async function TlozBoardPage() {
  const [missions, projects, seasons, episodes] = await Promise.all([
    getTlozMissions(),
    getTlozProjects(),
    getTlozSeasons(),
    getTlozEpisodes()
  ]);

  return (
    <TlozPageShell title="Board" description="Missions agrupadas por Now, Next, Later y Completed." currentView="Board">
      <TlozFilters projects={projects} seasons={seasons} episodes={episodes} />
      <MissionBoard missions={missions} />
    </TlozPageShell>
  );
}
