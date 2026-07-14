import { PageSubHeader } from "@zipform/ui";
import { getTlozEpisodes, getTlozMissions, getTlozProjects, getTlozQuestItems, getTlozSeasons, getTlozUsers } from "../../lib/tloz-data";
import { TlozHeader } from "./tloz-header";
import { inventoryItemHref, missionHref, projectHref } from "../../lib/tloz-routes";
import type { TlozView } from "../../lib/tloz-routes";
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
  fullWidth?: boolean;
  supportedViews?: TlozView[];
  defaultView?: TlozView;
  inventoryControls?: boolean;
  missionControls?: boolean;
  stateScope?: string;
  controlProjectId?: string;
  createKind?: TlozCreateKind;
};

export async function TlozPageShell({
  title,
  description,
  projectLabel,
  detailLabel,
  breadcrumb,
  showSearch = true,
  showHeader = true,
  fullWidth = false,
  supportedViews = ["dashboard", "list", "board", "table", "calendar"],
  defaultView = "dashboard",
  inventoryControls = false,
  missionControls = true,
  stateScope,
  controlProjectId,
  createKind = "mission",
  children
}: TlozPageShellProps) {
  const [missions, projects, seasons, episodes, questItems, allUsers] = await Promise.all([
    getTlozMissions(),
    getTlozProjects(),
    getTlozSeasons(),
    getTlozEpisodes(),
    getTlozQuestItems(),
    getTlozUsers(),
  ]);
  const controlMissions = controlProjectId ? missions.filter((mission) => mission.projectId === controlProjectId) : missions;
  const users = controlProjectId ? allUsers.filter((user) => controlMissions.some((mission) => mission.ownerId === user.id)) : allUsers;
  const controlProjects = controlProjectId ? projects.filter((project) => project.id === controlProjectId) : projects;
  const seasonIds = new Set(controlMissions.map((mission) => mission.seasonId).filter(Boolean));
  const episodeIds = new Set(controlMissions.map((mission) => mission.episodeId).filter(Boolean));
  const controlSeasons = controlProjectId ? seasons.filter((season) => seasonIds.has(season.id)) : seasons;
  const controlEpisodes = controlProjectId ? episodes.filter((episode) => episodeIds.has(episode.id)) : episodes;

  return (
    <TlozCreateProvider kind={createKind} projects={projects} users={allUsers} missions={missions} questItems={questItems} fixedProjectId={createKind === "mission" ? controlProjectId : undefined}>
    <TlozViewStateProvider supportedViews={supportedViews} defaultView={defaultView} projects={controlProjects} seasons={controlSeasons} episodes={controlEpisodes} users={users} inventory={inventoryControls} showMissionControls={missionControls} storageScope={stateScope}>
      <div className={fullWidth ? "tloz-page-full" : "page-stack tloz-page"}>
        <TlozHeader
          title={title}
          projectLabel={projectLabel}
          detailLabel={detailLabel}
          breadcrumb={breadcrumb}
          showSearch={showSearch}
          showHeader={showHeader}
          commandEntities={{
            missions: missions.map((mission) => ({ id: mission.id, label: mission.title, icon: mission.icon, type: mission.type, href: mission.project ? missionHref(mission.project, mission.displayId) : "/tloz" })),
            projects: projects.map((project) => ({ id: project.id, label: project.name, icon: project.icon, href: projectHref(project) })),
            questItems: questItems.map((questItem) => ({ id: questItem.id, label: questItem.name, icon: questItem.icon, href: inventoryItemHref(questItem.id) })),
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
