import { TlozFilters, TlozPageShell } from "../../../components/tloz/tloz-shell";
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
        <div style={{ flexShrink: 0, padding: "16px 26px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "21px", fontWeight: 700, letterSpacing: "-0.02em" }}>Board</h1>
            <p style={{ margin: "4px 0 0", color: "#6B6B6B", fontSize: "13px" }}>Flujo de trabajo del equipo · agrupado por estado</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ display: "inline-flex", background: "#F1F0EE", borderRadius: "999px", padding: "3px", gap: "2px" }}>
              <span style={{ padding: "6px 13px", borderRadius: "999px", fontSize: "12.5px", fontWeight: 600, background: "#fff", color: "#1D1D1B", boxShadow: "0 1px 2px rgba(29,29,27,0.07)" }}>Todo el equipo</span>
              <span style={{ padding: "6px 13px", borderRadius: "999px", fontSize: "12.5px", fontWeight: 500, color: "#6B6B6B", cursor: "pointer" }}>Solo yo</span>
            </div>
            <TlozFilters projects={projects} seasons={seasons} episodes={episodes} />
          </div>
        </div>
        <div style={{ flex: 1, padding: "4px 26px 26px" }}>
          <BoardClient missions={missions} />
        </div>
      </div>
    </TlozPageShell>
  );
}
