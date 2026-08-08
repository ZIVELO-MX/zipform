import { DocumentCollectionPage } from "../../components/tloz/document-collection-page";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ cursor?: string }> }) {
  const { cursor } = await searchParams;
  return (
    <DocumentCollectionPage
      definitionKey="projects"
      kind="project"
      title="Projects"
      createKind="project"
      cursor={cursor}
      basePath="/projects"
    />
  );
}
