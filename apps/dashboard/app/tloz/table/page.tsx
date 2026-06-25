import { MissionTable } from "../../../components/tloz/mission-views";
import { TlozFilters, TlozPageShell } from "../../../components/tloz/tloz-shell";
import { getTlozEpisodes, getTlozMissions, getTlozProjects, getTlozSeasons } from "../../../lib/tloz-data";

export default async function TlozTablePage() {
  const [missions, projects, seasons, episodes] = await Promise.all([
    getTlozMissions(),
    getTlozProjects(),
    getTlozSeasons(),
    getTlozEpisodes()
  ]);

  return (
    <TlozPageShell title="Tabla" description="Vista tabular para comparar Missions por tipo, proyecto, owner, fecha y progreso." currentView="Tabla">
      <TlozFilters projects={projects} seasons={seasons} episodes={episodes} />
      <MissionTable missions={missions} />
    </TlozPageShell>
  );
}
