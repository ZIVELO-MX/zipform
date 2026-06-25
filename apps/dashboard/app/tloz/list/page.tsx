import { MissionList } from "../../../components/tloz/mission-views";
import { TlozFilters, TlozPageShell } from "../../../components/tloz/tloz-shell";
import { getTlozEpisodes, getTlozMissions, getTlozProjects, getTlozSeasons } from "../../../lib/tloz-data";

export default async function TlozListPage() {
  const [missions, projects, seasons, episodes] = await Promise.all([
    getTlozMissions(),
    getTlozProjects(),
    getTlozSeasons(),
    getTlozEpisodes()
  ]);

  return (
    <TlozPageShell title="Lista" description="Lista compacta de Missions con estado, owner, fecha y bloqueos." currentView="Lista">
      <TlozFilters projects={projects} seasons={seasons} episodes={episodes} />
      <MissionList missions={missions} />
    </TlozPageShell>
  );
}
