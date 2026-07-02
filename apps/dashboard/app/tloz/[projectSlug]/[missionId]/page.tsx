import { notFound } from "next/navigation";
import { TlozPageShell } from "../../../../components/tloz/tloz-shell";
import { getTlozEpisodes, getTlozMissionDetail, getTlozMissions, getTlozProjects, getTlozQuestItems, getTlozResources, getTlozSeasons, getTlozUsers } from "../../../../lib/tloz-data";
import { findProjectBySlug } from "../../../../lib/tloz-routes";
import { getSystemProject } from "../../../../lib/tloz-routes";
import { SystemEntityDetail } from "../../../../components/tloz/system-project-detail";
import { MissionDetailPage } from "../../../../components/tloz/mission-detail-page";

export default async function ProjectMissionPage({ params }: { params: Promise<{ projectSlug: string; missionId: string }> }) {
  const { projectSlug, missionId } = await params;
  const [mission, missions, projects, seasons, episodes, questItems, resources, allUsers] = await Promise.all([
    getTlozMissionDetail(missionId), getTlozMissions(), getTlozProjects(), getTlozSeasons(), getTlozEpisodes(), getTlozQuestItems(), getTlozResources(), getTlozUsers(),
  ]);
  const systemProject = getSystemProject(projectSlug);
  if (systemProject?.detailVariant === "inventory") {
    const item = questItems.find((candidate) => candidate.id === missionId);
    if (!item) notFound();
    return <TlozPageShell title="Lobby" showHeader={false}><SystemEntityDetail variant="inventory" entity={item} missions={missions} users={allUsers} resources={resources.filter((resource) => resource.questItemId === item.id)} /></TlozPageShell>;
  }
  if (systemProject?.detailVariant === "project") {
    const selectedProject = projects.find((candidate) => candidate.id === missionId) ?? findProjectBySlug(projects, missionId);
    if (!selectedProject) notFound();
    return <TlozPageShell title="Lobby" showHeader={false}><SystemEntityDetail variant="project" entity={selectedProject} missions={missions} users={allUsers} resources={resources.filter((resource) => resource.projectId === selectedProject.id)} /></TlozPageShell>;
  }
  const project = findProjectBySlug(projects, projectSlug);
  if (!project || !mission || mission.projectId !== project.id) notFound();
  const projectMissions = missions.filter((item) => item.projectId === project.id);

  return (
    <TlozPageShell title="Lobby" showHeader={false}>
      <div className="min-h-full bg-[#FAFAF9]">
        <MissionDetailPage mission={mission} options={{ projects: [project], seasons, episodes, users: allUsers, missions: projectMissions, questItems }} />
      </div>
    </TlozPageShell>
  );
}
