import { notFound } from "next/navigation";
import { ProjectContractEditor } from "../../../components/tloz/project-contract-editor";
import { SystemEntityDetailPage } from "../../../components/tloz/system-entity-detail-page";
import { TlozPageShell } from "../../../components/tloz/tloz-shell";
import {
  getTlozDocument,
  getTlozMissions,
  getTlozProjects,
  getTlozResources,
  getTlozUsers,
} from "../../../lib/tloz-data";
import { findProjectBySlug } from "../../../lib/tloz-routes";

export default async function ProjectDocumentPage({
  params,
}: {
  params: Promise<{ projectSlug: string }>;
}) {
  const { projectSlug } = await params;
  const [projects, missions, users, resources] = await Promise.all([
    getTlozProjects(),
    getTlozMissions(),
    getTlozUsers(),
    getTlozResources(),
  ]);
  const project = findProjectBySlug(projects, projectSlug);
  if (!project) notFound();

  const document = await getTlozDocument(project.id);
  if (!document) notFound();

  return (
    <TlozPageShell title={project.name} showHeader={false}>
      <div className="min-h-full bg-[#FAFAF9]">
        <SystemEntityDetailPage
          variant="project"
          entity={project}
          missions={missions}
          users={users}
          resources={resources.filter((resource) => resource.projectId === project.id)}
        />
        <ProjectContractEditor document={document} />
      </div>
    </TlozPageShell>
  );
}
