import { DocumentCollectionPage } from "../../components/tloz/document-collection-page";

export default async function ProjectsPage() {
  return (
    <DocumentCollectionPage
      definitionKey="projects"
      kind="project"
      title="Projects"
      createKind="project"
    />
  );
}
