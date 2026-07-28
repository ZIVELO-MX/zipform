import { ProjectWorkspacePage } from "../../components/tloz/project-workspace-page";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectSlug: string }>;
}) {
  const { projectSlug } = await params;
  return <ProjectWorkspacePage projectSlug={projectSlug} />;
}
