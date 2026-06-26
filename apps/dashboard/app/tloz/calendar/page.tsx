import { TlozFilters, TlozPageShell } from "../../../components/tloz/tloz-shell";
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
      <div style={{ flexShrink: 0, padding: "18px 26px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "21px", fontWeight: 700, letterSpacing: "-0.02em" }}>Calendario</h1>
          <p style={{ margin: "4px 0 0", color: "#6B6B6B", fontSize: "13px" }}>Missions con fecha de vencimiento</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <TlozFilters projects={projects} seasons={seasons} episodes={episodes} />
        </div>
      </div>
      <div className="tloz-scrl" style={{ flex: 1, overflow: "auto", padding: "0 26px 26px" }}>
        <CalendarClient missions={missions} />
      </div>
    </TlozPageShell>
  );
}
