import { notFound } from "next/navigation";
import { TlozPageShell } from "../../../../components/tloz/tloz-shell";
import { TlozViewRenderer } from "../../tloz-view-renderer";
import {
  getTlozDashboardSummary,
  getTlozEpisodes,
  getTlozMissions,
  getTlozProjects,
  getTlozQuestItems,
  getTlozSeasons,
} from "../../../../lib/tloz-data";
import type { TlozDashboardSummary, TlozMissionRecord } from "../../../../lib/tloz-data";
import { resolveMissionIcon } from "../../../../components/tloz/tloz-utils";
import Link from "next/link";

type Props = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function filterSummaryByProject(summary: TlozDashboardSummary, projectId: string): TlozDashboardSummary {
  return {
    ...summary,
    nowMissions: summary.nowMissions.filter((m) => m.projectId === projectId),
    mainQuests: summary.mainQuests.filter((m) => m.projectId === projectId),
    upcomingMissions: summary.upcomingMissions.filter((m) => m.projectId === projectId),
    futureMissions: summary.futureMissions.filter((m) => m.projectId === projectId),
    projects: summary.projects.filter((p) => p.id === projectId),
  };
}

export default async function ProjectDetailPage({ params, searchParams }: Props) {
  const { projectId } = await params;
  const sp = await searchParams;
  const view = typeof sp.view === "string" ? sp.view : "dashboard";

  const [projects, allMissions, summary, seasons, episodes, questItems] = await Promise.all([
    getTlozProjects(),
    getTlozMissions(),
    getTlozDashboardSummary(),
    getTlozSeasons(),
    getTlozEpisodes(),
    getTlozQuestItems(),
  ]);

  const project = projects.find((p) => p.id === projectId);
  if (!project) notFound();

  const projectMissions = allMissions.filter((m) => m.projectId === projectId);
  const filteredSummary = filterSummaryByProject(summary, projectId);
  const users = Array.from(new Map(allMissions.map((m) => [m.owner.id, m.owner])).values());

  const detailOptions = {
    missions: allMissions,
    projects,
    seasons,
    episodes,
    questItems,
    users,
  };

  const Icon = resolveMissionIcon(project.icon);

  return (
    <TlozPageShell
      title="Missions"
      projectLabel={project.name}
      showSearch
      showDisplaySwitcher
      fullWidth={view === "board"}
    >
      <div className="border-b border-carbon/10 bg-white/60 px-6 py-5">
        <div className="mx-auto flex max-w-[1180px] items-center gap-4">
          <Link href="/tloz/projects" className="shrink-0 text-carbon/30 hover:text-carbon/60">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
          </Link>
          <span className="grid size-9 shrink-0 place-items-center rounded-xl text-carbon/60 [&_svg]:size-[18px]" style={{ background: `${project.color}18`, color: project.color }}><Icon aria-hidden="true" /></span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="m-0 text-[17px] font-bold text-carbon">{project.name}</h1>
              <span className="inline-block rounded-full px-[8px] py-[2px] text-[10px] font-bold" style={{ background: project.status === "active" ? "#E6F4EA" : "#F0EFED", color: project.status === "active" ? "#1E6B3C" : "#6B6B6B" }}>{project.status === "active" ? "Activo" : project.status}</span>
            </div>
            {project.description ? (
              <p className="m-0 mt-0.5 text-[13px] text-carbon/55">{project.description}</p>
            ) : null}
          </div>
          <div className="ml-auto flex items-center gap-5 text-[12px] text-carbon/45">
            <span className="font-mono font-medium">{projectMissions.length} misiones</span>
          </div>
        </div>
      </div>

      <TlozViewRenderer
        view={view}
        summary={filteredSummary}
        missions={projectMissions}
        allMissions={allMissions}
        projects={[project]}
        seasons={seasons}
        episodes={episodes}
        users={users}
        questItems={questItems}
        detailOptions={detailOptions}
      />
    </TlozPageShell>
  );
}
