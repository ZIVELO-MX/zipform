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
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <TlozViewHeader title="Board" description="Flujo de trabajo del equipo · agrupado por estado" showAudienceToggle>
          <TlozFilters projects={projects} seasons={seasons} episodes={episodes} />
        </TlozViewHeader>
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden px-[26px] pb-[26px] pt-1">
          <BoardClient missions={missions} projects={projects} episodes={episodes} />
        </div>
      </div>
    </TlozPageShell>
  );
}
