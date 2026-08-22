import { PageSubHeader } from "@tloz/ui";
import { getTlozMissions, getTlozProjectDocuments, getTlozProjects, getTlozQuestItems, getTlozUsers } from "../../lib/tloz-data";
import { TlozHeader } from "./tloz-header";
import type { TlozView } from "../../lib/tloz-routes";
import type { ContainerRecord, TlozDocument, UserProfile } from "@tloz/types";
import { TlozViewStateProvider } from "./tloz-view-state";
import { TlozCreateProvider, type TlozCreateKind } from "./tloz-create";
import type { TlozControlKind } from "./tloz-control-capabilities";

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
  controlKind?: TlozControlKind;
  controlCreate?: React.ReactNode | false;
  createKind?: TlozCreateKind;
  canonicalContainer?: ContainerRecord;
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
  controlKind,
  controlCreate,
  createKind = "mission",
  canonicalContainer,
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
    <TlozCreateProvider kind={createKind} projects={projects} users={allUsers} missions={missions} questItems={questItems} projectContracts={projectContracts} fixedProjectId={createKind === "mission" ? controlProjectId : undefined} canonicalContainer={canonicalContainer}>
    <TlozViewStateProvider
      supportedViews={supportedViews}
      defaultView={defaultView}
      projects={controlProjects}
      users={users}
      controlKind={controlKind ?? (createKind === "workshop" ? "project" : createKind === "library" ? "inventory" : createKind)}
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
          controlCreate={controlCreate}
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
