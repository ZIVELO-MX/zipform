import { DocumentEntityPage } from "../../../components/tloz/document-entity-page";

export default async function ProjectDocumentPage({
  params,
}: {
  params: Promise<{ projectSlug: string }>;
}) {
  const { projectSlug } = await params;
  return (
    <DocumentEntityPage
      definitionKey="projects"
      identifier={projectSlug}
      kind="project"
    />
  );
}
