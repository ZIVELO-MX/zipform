import { notFound } from "next/navigation";
import type { TlozDashboardSummary } from "../../lib/tloz-data";
import {
  getTlozDashboardSummary,
  getTlozDocument,
  getTlozDocumentDefinition,
  getTlozDocuments,
  getTlozMissions,
  getTlozProjects,
  getTlozQuestItems,
} from "../../lib/tloz-data";
import { findProjectBySlug } from "../../lib/tloz-routes";
import type { TlozView } from "../../lib/tloz-routes";
import { TlozViewRenderer } from "../../app/tloz/tloz-view-renderer";
import { DocumentViewRenderer } from "./document-view-renderer";
import { TlozPageShell } from "./tloz-shell";

export async function ProjectWorkspacePage({ projectSlug }: { projectSlug: string }) {
  const [projects, allMissions, summary, inventory] = await Promise.all([
    getTlozProjects(),
    getTlozMissions(),
    getTlozDashboardSummary(),
    getTlozQuestItems(),
  ]);
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
  const projectDocument = await getTlozDocument(project.id);
  if (!projectDocument) notFound();
  const [missionDocuments, documentDefinition] = await Promise.all([
    getTlozDocuments("mission", projectDocument.id),
    getTlozDocumentDefinition(`project:${projectDocument.id}:children`),
  ]);
  if (!documentDefinition) notFound();
  const statusOptions = projectDocument?.contract?.fields.find((field) => field.key === "status")?.options ?? [];
  const detailOptions = { missions, projects: [project], questItems: projectInventory, users };
  const supportedViews = documentDefinition.views
    .map((view) => view.id)
    .filter((view): view is TlozView => view !== "detail");

  return (
    <TlozPageShell
      title={project.name}
      breadcrumb={[
        { label: "Lobby", href: "/" },
        { label: "Projects", href: "/projects" },
        project.name,
      ]}
      fullWidth
      supportedViews={supportedViews}
      defaultView={documentDefinition.defaultView as TlozView}
      controlProjectId={project.id}
      stateScope={`project:${project.slug}`}
    >
      <DocumentViewRenderer
        documents={missionDocuments.data}
        definition={documentDefinition}
        users={users}
        missionRecords={missions}
        fallback={(
          <TlozViewRenderer
            summary={projectSummary}
            missions={missions}
            allMissions={missions}
            projects={[project]}
            users={users}
            questItems={projectInventory}
            detailOptions={detailOptions}
            statusOptions={statusOptions}
            hideProjectSections
          />
        )}
      />
    </TlozPageShell>
  );
}
