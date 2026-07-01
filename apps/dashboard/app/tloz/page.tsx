import { TlozPageShell } from "../../components/tloz/tloz-shell";
import { TlozViewRenderer } from "./tloz-view-renderer";
import {
  getTlozDashboardSummary,
  getTlozEpisodes,
  getTlozMissionFilters,
  getTlozMissions,
  getTlozProjects,
  getTlozQuestItems,
  getTlozSeasons,
} from "../../lib/tloz-data";
import type { TlozMissionRecord } from "../../lib/tloz-data";
import { Suspense } from "react";
import { TlozLoading } from "../../components/tloz/tloz-loading";

type TlozPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function TlozData({ searchParams }: TlozPageProps) {
  const params = await searchParams;
  const view = typeof params.view === "string" ? params.view : "dashboard";
  const filters = await getTlozMissionFilters(searchParams);

  const dashboardView = view === "dashboard";

  const [summary, missions, allMissions, projects, seasons, episodes, questItems] = await Promise.all([
    dashboardView ? getTlozDashboardSummary() : Promise.resolve(null),
    dashboardView ? Promise.resolve([] as TlozMissionRecord[]) : getTlozMissions(filters),
    getTlozMissions(),
    getTlozProjects(),
    getTlozSeasons(),
    getTlozEpisodes(),
    getTlozQuestItems(),
  ]);

  const users = Array.from(new Map(allMissions.map((m) => [m.owner.id, m.owner])).values());

  const projectLabel = params.project ? projects.find(p => p.id === params.project)?.name : undefined;

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
      title="Missions"
      projectLabel={projectLabel}
      showSearch
      showDisplaySwitcher
      fullWidth={view === "board"}
    >
      <TlozViewRenderer
        view={view}
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

export default async function TlozPage(props: TlozPageProps) {
  return (
    <Suspense fallback={<TlozLoading />}>
      <TlozData searchParams={props.searchParams} />
    </Suspense>
  );
}
