import { notFound } from "next/navigation";
import { TlozPageShell } from "../../../components/tloz/tloz-shell";
import { TlozViewRenderer } from "../tloz-view-renderer";
import {
  getTlozDashboardSummary,
  getTlozEpisodes,
  getTlozMissions,
  getTlozProjects,
  getTlozQuestItems,
  getTlozResources,
  getTlozSeasons,
  getTlozUsers,
} from "../../../lib/tloz-data";
import type { TlozDashboardSummary } from "../../../lib/tloz-data";
import { findProjectBySlug, projectBreadcrumb } from "../../../lib/tloz-routes";
import { getSystemProject } from "../../../lib/tloz-routes";
import { InventoryProjectView, ProjectsSystemView } from "../../../components/tloz/system-project-views";
import { CreateNewEntityButton } from "../../../components/tloz/tloz-create";

type Props = {
  params: Promise<{ projectSlug: string }>;
};

export default async function ProjectDetailPage({ params }: Props) {
  const { projectSlug } = await params;
  const [projects, allMissions, summary, seasons, episodes, inventory, resources, allUsers] = await Promise.all([
    getTlozProjects(), getTlozMissions(), getTlozDashboardSummary(), getTlozSeasons(), getTlozEpisodes(), getTlozQuestItems(), getTlozResources(), getTlozUsers(),
  ]);
  const systemProject = getSystemProject(projectSlug);
  if (systemProject) {
    return (
      <TlozPageShell
        title="Lobby"
        breadcrumb={[systemProject.label]}
        supportedViews={[...systemProject.availableViews]}
        defaultView={systemProject.defaultView}
        missionControls={systemProject.showMissionControls}
        createKind={systemProject.detailVariant === "inventory" ? "inventory" : "project"}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {systemProject.detailVariant === "inventory"
            ? <InventoryProjectView items={inventory} missions={allMissions} users={allUsers} resources={resources} />
            : <ProjectsSystemView projects={projects} missions={allMissions} users={allUsers} resources={resources} />}
          <div className="px-[26px] pb-[26px]"><CreateNewEntityButton /></div>
        </div>
      </TlozPageShell>
    );
  }
  const project = findProjectBySlug(projects, projectSlug);
  if (!project) notFound();

  const missions = allMissions.filter((mission) => mission.projectId === project.id);
  const inventoryIds = new Set(missions.flatMap((mission) => mission.questItems.map((item) => item.id)));
  const projectInventory = inventory.filter((item) => inventoryIds.has(item.id));
  const projectSummary: TlozDashboardSummary = {
    ...summary,
    activeQuest: summary.activeQuest?.projectId === project.id ? summary.activeQuest : null,
    activeSupportQuest: summary.activeSupportQuest?.projectId === project.id ? summary.activeSupportQuest : null,
    nowMissions: summary.nowMissions.filter((mission) => mission.projectId === project.id),
    mainQuests: summary.mainQuests.filter((mission) => mission.projectId === project.id),
    upcomingMissions: summary.upcomingMissions.filter((mission) => mission.projectId === project.id),
    futureMissions: summary.futureMissions.filter((mission) => mission.projectId === project.id),
    projects: summary.projects.filter((item) => item.id === project.id),
    recentActivity: [],
    questItems: projectInventory,
  };
  const users = Array.from(new Map(missions.map((mission) => [mission.owner.id, mission.owner])).values());
  const detailOptions = { missions, projects: [project], seasons, episodes, questItems: projectInventory, users };

  return (
    <TlozPageShell title="Lobby" breadcrumb={[projectBreadcrumb(project)]} fullWidth controlProjectId={project.id}>
      <TlozViewRenderer summary={projectSummary} missions={missions} allMissions={missions} projects={[project]} seasons={seasons} episodes={episodes} users={users} questItems={projectInventory} detailOptions={detailOptions} hideProjectSections />
    </TlozPageShell>
  );
}
