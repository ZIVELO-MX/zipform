import { notFound } from "next/navigation";
import { TlozPageShell } from "../../../../components/tloz/tloz-shell";
import { getTlozMissions, getTlozProjects, getTlozResources } from "../../../../lib/tloz-data";
import { ProjectDetail } from "./project-detail";

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectDetailPage({ params }: Props) {
  const { projectId } = await params;
  const [projects, missions, resources] = await Promise.all([
    getTlozProjects(),
    getTlozMissions(),
    getTlozResources(),
  ]);

  const project = projects.find((p) => p.id === projectId);
  if (!project) notFound();

  const projectMissions = missions.filter((m) => m.projectId === projectId);
  const projectResources = resources.filter((r) => projectMissions.some((m) => m.id === r.missionId));

  return (
    <TlozPageShell title="Missions" projectLabel={project.name}>
      <ProjectDetail project={project} missions={projectMissions} resources={projectResources} />
    </TlozPageShell>
  );
}
