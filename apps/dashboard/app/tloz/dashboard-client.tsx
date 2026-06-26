"use client";

import { useState } from "react";
import { PageSubHeader, SegmentedControl } from "@zipform/ui";
import {
  DashboardNowSection,
  DashboardMainQuests,
  DashboardNextLaterSection,
  DashboardProjectsSection,
  DashboardQuestItemsSection,
  DashboardActivitySection,
} from "../../components/tloz/mission-views";
import { MissionSlideOver } from "../../components/tloz/mission-slide-over";
import type { TlozDashboardSummary, TlozMissionRecord } from "../../lib/tloz-data";

export function DashboardClient({ summary }: { summary: TlozDashboardSummary }) {
  const [selectedMission, setSelectedMission] = useState<TlozMissionRecord | null>(null);

  return (
    <>
      <div style={{ maxWidth: "1180px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "26px", padding: "24px 26px 48px" }}>
        <PageSubHeader
          className="px-0 pb-0 pt-0"
          title="Dashboard"
          description="Visión general del equipo · trabajo activo en todos los proyectos · 4 personas"
          actions={
            <SegmentedControl
              aria-label="Filtrar por audiencia"
              value="team"
              options={[
                { label: "Todo el equipo", value: "team" },
                { label: "Solo yo", value: "me" },
              ]}
            />
          }
        />

        <DashboardNowSection missions={summary.nowMissions} onSelect={setSelectedMission} />

        <DashboardMainQuests missions={summary.mainQuests} onSelect={setSelectedMission} />

        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <DashboardNextLaterSection
            title="Próximas · Next"
            subtitle="Validadas, esperando capacidad"
            missions={summary.upcomingMissions}
            type="next"
            onSelect={setSelectedMission}
          />
          <DashboardNextLaterSection
            title="Más adelante · Later"
            subtitle="Ideas · sin validar · bloqueadas"
            missions={summary.futureMissions}
            type="later"
            onSelect={setSelectedMission}
          />
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px" }}>
          <DashboardProjectsSection projects={summary.projects} missions={summary.nowMissions} />
          <DashboardActivitySection activities={summary.recentActivity} />
        </section>

        <DashboardQuestItemsSection questItems={summary.questItems} />
      </div>

      <MissionSlideOver mission={selectedMission} onClose={() => setSelectedMission(null)} />
    </>
  );
}
