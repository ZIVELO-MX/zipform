import { MissionCalendar } from "../../../components/tloz/mission-views";
import { TlozFilters, TlozPageShell } from "../../../components/tloz/tloz-shell";
import { getTlozEpisodes, getTlozMissions, getTlozProjects, getTlozSeasons } from "../../../lib/tloz-data";

export default async function TlozCalendarPage() {
  const [missions, projects, seasons, episodes] = await Promise.all([
    getTlozMissions(),
    getTlozProjects(),
    getTlozSeasons(),
    getTlozEpisodes()
  ]);

  return (
    <TlozPageShell title="Calendario" description="Solo muestra Missions mock que tienen due date." currentView="Calendario">
      <TlozFilters projects={projects} seasons={seasons} episodes={episodes} />
      <MissionCalendar missions={missions} />
    </TlozPageShell>
  );
}
