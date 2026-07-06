import { notFound } from "next/navigation";
import { TlozPageShell } from "../../../../components/tloz/tloz-shell";
import { getTlozEpisodes, getTlozMissionDetail, getTlozMissions, getTlozProjects, getTlozQuestItems, getTlozResources, getTlozSeasons, getTlozUsers } from "../../../../lib/tloz-data";
import { findProjectBySlug } from "../../../../lib/tloz-routes";
import { getSystemProject } from "../../../../lib/tloz-routes";
import { SystemEntityDetail } from "../../../../components/tloz/system-project-detail";
import { MissionDetailPage } from "../../../../components/tloz/mission-detail-page";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ProjectMissionPage({ params }: { params: Promise<{ projectSlug: string; missionId: string }> }) {
  const { projectSlug, missionId } = await params;
  const [mission, missions, projects, seasons, episodes, questItems, resources, allUsers] = await Promise.all([
    getTlozMissionDetail(missionId), getTlozMissions(), getTlozProjects(), getTlozSeasons(), getTlozEpisodes(), getTlozQuestItems(), getTlozResources(), getTlozUsers(),
  ]);
  const systemProject = getSystemProject(projectSlug);
  if (systemProject?.detailVariant === "inventory") {
    const item = questItems.find((candidate) => candidate.id === missionId);
    if (!item) notFound();
    return <TlozPageShell title="Lobby" showHeader={false}><div className="min-h-full bg-[#FAFAF9]"><SystemEntityDetail variant="inventory" entity={item} missions={missions} users={allUsers} resources={resources.filter((resource) => resource.questItemId === item.id)} /></div></TlozPageShell>;
  }
  if (systemProject?.detailVariant === "project") {
    const selectedProject = projects.find((candidate) => candidate.id === missionId) ?? findProjectBySlug(projects, missionId);
    if (!selectedProject) notFound();
    return <TlozPageShell title="Lobby" showHeader={false}><div className="min-h-full bg-[#FAFAF9]"><SystemEntityDetail variant="project" entity={selectedProject} missions={missions} users={allUsers} resources={resources.filter((resource) => resource.projectId === selectedProject.id)} /></div></TlozPageShell>;
  }
  const project = findProjectBySlug(projects, projectSlug);
  if (!project || !mission || mission.projectId !== project.id) notFound();
  const projectMissions = missions.filter((item) => item.projectId === project.id);

  return (
    <TlozPageShell title="Lobby" showHeader={false}>
      <div className="min-h-full bg-[#FAFAF9]">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-carbon/10 bg-[#FAFAF9]/95 px-4 py-3 backdrop-blur md:hidden">
          <Link href="/tloz" className="grid size-10 place-items-center rounded-lg text-carbon/60 hover:bg-carbon/5" aria-label="Volver a la lista de misiones">
            <ArrowLeft aria-hidden="true" />
          </Link>
          <p className="m-0 min-w-0 flex-1 truncate text-sm font-bold text-carbon/75">{mission.title}</p>
        </header>
        <MissionDetailPage mission={mission} options={{ projects: [project], seasons, episodes, users: allUsers, missions: projectMissions, questItems }} />
      </div>
    </TlozPageShell>
  );
}
