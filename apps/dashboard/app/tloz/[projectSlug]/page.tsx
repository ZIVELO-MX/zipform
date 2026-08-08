import { redirect } from "next/navigation";
import { getTlozMissions } from "../../../lib/tloz-data";
import { MissionDocumentPage } from "../../../components/tloz/mission-document-page";

export default async function LegacyTlozRoute({
  params,
}: {
  params: Promise<{ projectSlug: string }>;
}) {
  const { projectSlug } = await params;

  if (projectSlug === "inventory" || projectSlug === "projects" || projectSlug === "new") {
    redirect(`/${projectSlug}`);
  }

  const missions = await getTlozMissions();
  const mission = missions.find(
    (candidate) => candidate.displayId === projectSlug && candidate.project?.slug === "tloz",
  );
  if (mission) {
    return <MissionDocumentPage projectSlug="tloz" missionId={mission.displayId} />;
  }

  redirect(`/${encodeURIComponent(projectSlug)}`);
}
