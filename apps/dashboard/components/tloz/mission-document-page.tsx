import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getTlozMissionDetailWithAttachments,
  getTlozMissions,
  getTlozDocument,
  getTlozProjects,
  getTlozQuestItems,
  getTlozUsers,
} from "../../lib/tloz-data";
import { findProjectBySlug, projectHref } from "../../lib/tloz-routes";
import { getMissionCapabilities } from "../../app/tloz/actions";
import { MissionDetailPage } from "./mission-detail-page";
import { TlozPageShell } from "./tloz-shell";

export async function MissionDocumentPage({
  projectSlug,
  missionId,
}: {
  projectSlug: string;
  missionId: string;
}) {
  const [mission, missions, projects, questItems, allUsers, document] = await Promise.all([
    getTlozMissionDetailWithAttachments(missionId),
    getTlozMissions(),
    getTlozProjects(),
    getTlozQuestItems(),
    getTlozUsers(),
    getTlozDocument(missionId),
  ]);
  const project = findProjectBySlug(projects, projectSlug);
  if (!project || !mission || mission.projectId !== project.id) notFound();

  const projectMissions = missions.filter((item) => item.projectId === project.id);
  const capabilities = await getMissionCapabilities(missionId);
  const projectDocument = document?.parentId ? await getTlozDocument(document.parentId) : null;

  return (
    <TlozPageShell
      title={mission.title}
      breadcrumb={["Lobby", { label: project.name, href: projectHref(project) }, mission.title]}
      showSearch={false}
      showControls={false}
    >
      <div className="min-h-full bg-[#FAFAF9]">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-carbon/10 bg-[#FAFAF9]/95 px-4 py-3 backdrop-blur md:hidden">
          <Link
            href={projectHref(project)}
            className="grid size-10 place-items-center rounded-lg text-carbon/60 hover:bg-carbon/5"
            aria-label="Volver al Project"
          >
            <ArrowLeft aria-hidden="true" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-[11px] font-medium text-carbon/45">{project.name} /</p>
            <p className="m-0 truncate text-sm font-bold text-carbon/75">{mission.title}</p>
          </div>
        </header>
        <MissionDetailPage
          mission={mission}
          options={{
            projects: [project],
            users: allUsers,
            missions: projectMissions,
            questItems,
            document: document ?? undefined,
            contract: projectDocument?.contract?.fields ?? [],
          }}
          canUpdate={capabilities.canUpdate}
        />
      </div>
    </TlozPageShell>
  );
}
