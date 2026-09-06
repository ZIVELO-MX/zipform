import type { CollectionSearchParams } from "../../components/tloz/collection-query";
import { DocumentCollectionPage } from "../../components/tloz/document-collection-page";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<CollectionSearchParams> }) {
  const params = await searchParams;
  const { cursor } = params;
  return (
    <DocumentCollectionPage searchParams={params}
      definitionKey="projects"
      kind="project"
      title="Projects"
      createKind="project"
      cursor={cursor}
      basePath="/projects"
    />
  );
}
