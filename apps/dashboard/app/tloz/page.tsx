import { TlozPageShell } from "../../components/tloz/tloz-shell";
import { DashboardClient } from "./dashboard-client";
import { getTlozDashboardSummary, getTlozEpisodes, getTlozMissions, getTlozProjects, getTlozQuestItems, getTlozSeasons } from "../../lib/tloz-data";
import { Suspense } from "react";
import { TlozLoading } from "../../components/tloz/tloz-loading";

async function DashboardData() {
  const [summary, missions, projects, seasons, episodes, questItems] = await Promise.all([
    getTlozDashboardSummary(), getTlozMissions(), getTlozProjects(), getTlozSeasons(), getTlozEpisodes(), getTlozQuestItems()
  ]);
  const users = Array.from(new Map(missions.map((mission) => [mission.owner.id, mission.owner])).values());
  return <DashboardClient summary={summary} detailOptions={{ missions, projects, seasons, episodes, questItems, users }} />;
}

export default function TlozPage() {
  return (
    <TlozPageShell
      title="Dashboard"
      description="Visión general del equipo · trabajo activo en todos los proyectos · 4 personas"
      currentView="Dashboard"
      showSearch={true}
      showHeader={true}
    >
      <Suspense fallback={<TlozLoading />}>
        <DashboardData />
      </Suspense>
    </TlozPageShell>
  );
}
