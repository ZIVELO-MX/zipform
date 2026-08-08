import { MissionDocumentPage } from "../../../components/tloz/mission-document-page";

export default async function MissionPage({
  params,
}: {
  params: Promise<{ projectSlug: string; missionId: string }>;
}) {
  const { projectSlug, missionId } = await params;
  return <MissionDocumentPage projectSlug={projectSlug} missionId={missionId} />;
}
