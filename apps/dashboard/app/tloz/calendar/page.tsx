import { TlozFilters, TlozPageShell, TlozViewHeader } from "../../../components/tloz/tloz-shell";
import { getTlozEpisodes, getTlozMissions, getTlozProjects, getTlozSeasons } from "../../../lib/tloz-data";
import { CalendarClient } from "./calendar-client";

export default async function TlozCalendarPage() {
  const [missions, projects, seasons, episodes] = await Promise.all([
    getTlozMissions(),
    getTlozProjects(),
    getTlozSeasons(),
    getTlozEpisodes()
  ]);

  return (
    <TlozPageShell title="Calendario" currentView="Calendario" showSearch>
      <TlozViewHeader title="Calendario" description="Missions con fecha de vencimiento">
        <TlozFilters projects={projects} seasons={seasons} episodes={episodes} />
      </TlozViewHeader>
      <div className="tloz-scrl" style={{ flex: 1, overflow: "auto", padding: "0 26px 26px" }}>
        <CalendarClient missions={missions} />
      </div>
    </TlozPageShell>
  );
}
