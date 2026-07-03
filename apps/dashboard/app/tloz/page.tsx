import { TlozPageShell } from "../../components/tloz/tloz-shell";
import { TlozViewRenderer } from "./tloz-view-renderer";
import {
  getTlozDashboardSummary,
  getTlozEpisodes,
  getTlozMissions,
  getTlozProjects,
  getTlozQuestItems,
  getTlozSeasons,
} from "../../lib/tloz-data";
import { Suspense } from "react";
import { TlozLoading } from "../../components/tloz/tloz-loading";

async function TlozData() {
  const [summary, missions, projects, seasons, episodes, questItems] = await Promise.all([
    getTlozDashboardSummary(),
    getTlozMissions(),
    getTlozProjects(),
    getTlozSeasons(),
    getTlozEpisodes(),
    getTlozQuestItems(),
  ]);
  const allMissions = missions;

  const users = Array.from(new Map(allMissions.map((m) => [m.owner.id, m.owner])).values());

  const detailOptions = {
    missions: allMissions,
    projects,
    seasons,
    episodes,
    questItems,
    users,
  };

  return (
    <TlozPageShell
      title="Lobby"
      showSearch
      fullWidth
    >
      <TlozViewRenderer
        summary={summary}
        missions={missions}
        allMissions={allMissions}
        projects={projects}
        seasons={seasons}
        episodes={episodes}
        users={users}
        questItems={questItems}
        detailOptions={detailOptions}
      />
    </TlozPageShell>
  );
}

export default async function TlozPage() {
  return (
    <Suspense fallback={<TlozLoading />}>
      <TlozData />
    </Suspense>
  );
}
