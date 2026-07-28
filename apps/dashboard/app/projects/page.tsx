import { TlozPageShell } from "../../components/tloz/tloz-shell";
import { ProjectsSystemView } from "../../components/tloz/system-project-views";
import { CreateNewEntityButton } from "../../components/tloz/tloz-create";
import {
  getTlozMissions,
  getTlozProjects,
  getTlozResources,
  getTlozUsers,
} from "../../lib/tloz-data";

export default async function ProjectsPage() {
  const [projects, missions, users, resources] = await Promise.all([
    getTlozProjects(),
    getTlozMissions(),
    getTlozUsers(),
    getTlozResources(),
  ]);

  return (
    <TlozPageShell
      title="Projects"
      supportedViews={["table", "list"]}
      defaultView="table"
      missionControls={false}
      createKind="project"
      stateScope="projects"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <ProjectsSystemView projects={projects} missions={missions} users={users} resources={resources} />
        <div className="px-[26px] pb-[26px]"><CreateNewEntityButton /></div>
      </div>
    </TlozPageShell>
  );
}
