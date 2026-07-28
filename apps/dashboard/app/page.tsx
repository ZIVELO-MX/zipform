import { Suspense } from "react";
import { TlozPageShell } from "../components/tloz/tloz-shell";
import { TlozLoading } from "../components/tloz/tloz-loading";
import { TlozViewRenderer } from "./tloz/tloz-view-renderer";
import {
  getTlozDashboardSummary,
  getTlozMissions,
  getTlozProjectDocuments,
  getTlozProjects,
  getTlozQuestItems,
} from "../lib/tloz-data";

async function LobbyData() {
  const [summary, missions, projects, questItems, documents] = await Promise.all([
    getTlozDashboardSummary(),
    getTlozMissions(),
    getTlozProjects(),
    getTlozQuestItems(),
    getTlozProjectDocuments(),
  ]);
  const users = Array.from(new Map(missions.map((mission) => [mission.owner.id, mission.owner])).values());
  const detailOptions = { missions, projects, questItems, users };
  const statusOptions = documents.data
    .flatMap((document) => document.contract?.fields.find((field) => field.key === "status")?.options ?? [])
    .filter((option, index, options) => options.findIndex((candidate) => candidate.value === option.value) === index);

  return (
    <TlozPageShell title="Lobby" showSearch fullWidth stateScope="lobby">
      <TlozViewRenderer
        summary={summary}
        missions={missions}
        allMissions={missions}
        projects={projects}
        users={users}
        questItems={questItems}
        detailOptions={detailOptions}
        statusOptions={statusOptions}
      />
    </TlozPageShell>
  );
}

export default function LobbyPage() {
  return <Suspense fallback={<TlozLoading />}><LobbyData /></Suspense>;
}
