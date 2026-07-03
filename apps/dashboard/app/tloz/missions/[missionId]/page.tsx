import { notFound } from "next/navigation";
import { MissionDetail } from "../../../../components/tloz/mission-detail";
import { TlozPageShell } from "../../../../components/tloz/tloz-shell";
import { getTlozEpisodes, getTlozMissionDetail, getTlozMissions, getTlozProjects, getTlozQuestItems, getTlozSeasons } from "../../../../lib/tloz-data";

type MissionDetailPageProps = {
  params: Promise<{ missionId: string }>;
};

export async function generateStaticParams() {
  const missions = await getTlozMissions();
  return missions.map((mission) => ({ missionId: mission.id }));
}

export default async function MissionDetailPage({ params }: MissionDetailPageProps) {
  const { missionId } = await params;
  const [mission, missions, projects, seasons, episodes, questItems] = await Promise.all([
    getTlozMissionDetail(missionId),
    getTlozMissions(),
    getTlozProjects(),
    getTlozSeasons(),
    getTlozEpisodes(),
    getTlozQuestItems(),
  ]);

  if (!mission) {
    notFound();
  }
  const users = Array.from(new Map(missions.map((item) => [item.owner.id, item.owner])).values());

  return (
    <TlozPageShell title="Missions" detailLabel={mission.title}>
      <div className="min-h-full bg-[#FAFAF9]">
        <MissionDetail mission={mission} options={{ projects, seasons, episodes, users, missions, questItems }} />
      </div>
    </TlozPageShell>
  );
}
