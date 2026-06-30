import { notFound } from "next/navigation";
import { MissionDetailView } from "../../../../components/tloz/mission-views";
import { TlozPageShell } from "../../../../components/tloz/tloz-shell";
import { getTlozEpisodes, getTlozMissionDetail, getTlozMissions, getTlozProjects } from "../../../../lib/tloz-data";

type MissionDetailPageProps = {
  params: Promise<{ missionId: string }>;
};

export async function generateStaticParams() {
  const missions = await getTlozMissions();
  return missions.map((mission) => ({ missionId: mission.id }));
}

export default async function MissionDetailPage({ params }: MissionDetailPageProps) {
  const { missionId } = await params;
  const [mission, projects, episodes] = await Promise.all([
    getTlozMissionDetail(missionId),
    getTlozProjects(),
    getTlozEpisodes(),
  ]);

  if (!mission) {
    notFound();
  }

  return (
    <TlozPageShell title={mission.title} description="Detalle completo de Mission con metadatos, dependencias, Quest Items, checklist, recursos y actividad placeholder." detailLabel="Mission Detail">
      <MissionDetailView mission={mission} editorOptions={{ projects, episodes }} />
    </TlozPageShell>
  );
}
