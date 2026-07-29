import { PageSubHeader } from "@tloz/ui";
import { getTlozMissions, getTlozProjectDocuments, getTlozProjects, getTlozQuestItems, getTlozUsers } from "../../lib/tloz-data";
import { TlozHeader } from "./tloz-header";
import { inventoryItemHref, missionHref, projectHref } from "../../lib/tloz-routes";
import type { TlozView } from "../../lib/tloz-routes";
import type { TlozDocument, UserProfile } from "@tloz/types";
import { TlozViewStateProvider } from "./tloz-view-state";
import { TlozCreateProvider, type TlozCreateKind } from "./tloz-create";

type TlozPageShellProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  projectLabel?: string;
  detailLabel?: string;
  breadcrumb?: Array<string | { label: string; href: string }>;
  showSearch?: boolean;
  showHeader?: boolean;
  showControls?: boolean;
  fullWidth?: boolean;
  supportedViews?: TlozView[];
  defaultView?: TlozView;
  stateScope?: string;
  controlProjectId?: string;
  createKind?: TlozCreateKind;
  documentNavigation?: {
    documents: TlozDocument[];
    users: UserProfile[];
  };
};

export async function TlozPageShell({
  title,
  description,
  projectLabel,
  detailLabel,
  breadcrumb,
  showSearch = true,
  showHeader = true,
  showControls = true,
  fullWidth = false,
  supportedViews = ["dashboard", "list", "board", "table", "calendar"],
  defaultView = "dashboard",
  stateScope,
  controlProjectId,
  createKind = "mission",
  documentNavigation,
  children
}: TlozPageShellProps) {
  const [missions, projects, questItems, allUsers, documents] = documentNavigation
    ? [[], [], [], documentNavigation.users, { data: [], nextCursor: null }]
    : await Promise.all([
      getTlozMissions(),
      getTlozProjects(),
      getTlozQuestItems(),
      getTlozUsers(),
      getTlozProjectDocuments(),
    ]);
  const controlMissions = controlProjectId ? missions.filter((mission) => mission.projectId === controlProjectId) : missions;
  const users = controlProjectId ? allUsers.filter((user) => controlMissions.some((mission) => mission.ownerId === user.id)) : allUsers;
  const controlProjects = controlProjectId ? projects.filter((project) => project.id === controlProjectId) : projects;
  const projectContracts = Object.fromEntries(
    documents.data
      .filter((document) => document.source)
      .map((document) => [document.source!.id, document.contract?.fields ?? []]),
  );

  return (
    <TlozCreateProvider kind={createKind} projects={projects} users={allUsers} missions={missions} questItems={questItems} projectContracts={projectContracts} fixedProjectId={createKind === "mission" ? controlProjectId : undefined}>
    <TlozViewStateProvider
      supportedViews={supportedViews}
      defaultView={defaultView}
      projects={controlProjects}
      users={users}
      controlKind={createKind}
      fixedProject={Boolean(controlProjectId)}
      storageScope={stateScope}
    >
      <div className={fullWidth ? "tloz-page-full" : "page-stack tloz-page"}>
        <TlozHeader
          title={title}
          projectLabel={projectLabel}
          detailLabel={detailLabel}
          breadcrumb={breadcrumb}
          showSearch={showSearch}
          showHeader={showHeader}
          showControls={showControls}
          commandEntities={{
            missions: missions.map((mission) => ({ id: mission.id, label: mission.title, icon: mission.icon, type: mission.type, href: mission.project ? missionHref(mission.project, mission.displayId) : "/" })),
            projects: documentNavigation
              ? documentNavigation.documents
                .filter((document) => document.kind === "project")
                .map((document) => ({
                  id: document.id,
                  label: document.title,
                  icon: typeof document.properties.icon === "string" ? document.properties.icon : "FolderKanban",
                  href: document.projectSlug ? `/${document.projectSlug}` : `/projects/${document.publicId}`,
                }))
              : projects.map((project) => ({ id: project.id, label: project.name, icon: project.icon, href: projectHref(project) })),
            questItems: documentNavigation
              ? documentNavigation.documents
                .filter((document) => document.kind === "inventory")
                .map((document) => ({
                  id: document.id,
                  label: document.title,
                  icon: typeof document.properties.icon === "string" ? document.properties.icon : "PackageOpen",
                  href: inventoryItemHref(document.publicId),
                }))
              : questItems.map((questItem) => ({ id: questItem.id, label: questItem.name, icon: questItem.icon, href: inventoryItemHref(questItem.id) })),
          }}
        />

        <main className="tloz-page-content" id="tloz-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </TlozViewStateProvider>
    </TlozCreateProvider>
  );
}

export function TlozSubpageHeader({ title, description }: { title: string; description: string }) {
  return <PageSubHeader title={title} description={description} />;
}

export function TlozViewHeader({
  title,
  description,
}: {
  title: string;
  description: React.ReactNode;
}) {
  return (
    <PageSubHeader
      title={title}
      description={description}
    />
  );
}
