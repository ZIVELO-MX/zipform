"use client";

import { useState } from "react";
import { PageSubHeader, SegmentedControl } from "@zipform/ui";
import {
  DashboardNowSection,
  DashboardMainQuests,
  DashboardNextLaterSection,
  DashboardProjectsSection,
  DashboardInventorySection,
  DashboardActivitySection,
} from "../../components/tloz/mission-views";
import { MissionSlideOver } from "../../components/tloz/mission-slide-over";
import type { TlozDashboardSummary, TlozMissionRecord } from "../../lib/tloz-data";
import type { MissionDetailOptions } from "../../components/tloz/mission-detail";
import type { TlozQuestItem } from "@zipform/types";
import { SystemEntitySlideOver } from "../../components/tloz/system-project-detail";

export function DashboardClient({ summary, detailOptions, hideProjectSections = false }: { summary: TlozDashboardSummary; detailOptions: MissionDetailOptions; hideProjectSections?: boolean }) {
  const [selectedMission, setSelectedMission] = useState<TlozMissionRecord | null>(null);
  const [selectedQuestItem, setSelectedQuestItem] = useState<TlozQuestItem | null>(null);

  return (
    <>
      <div className="px-4 pb-12 pt-6 md:px-[26px]" style={{ maxWidth: "1180px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "26px" }}>
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

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

        <section className={`grid grid-cols-1 gap-4 ${hideProjectSections ? "md:grid-cols-1" : "md:grid-cols-[1.5fr_1fr]"}`}>
          {hideProjectSections ? null : <DashboardProjectsSection projects={summary.projects} missions={summary.nowMissions} />}
          <DashboardActivitySection activities={summary.recentActivity} />
        </section>

        {hideProjectSections ? null : <DashboardInventorySection questItems={summary.questItems} onSelect={setSelectedQuestItem} />}
      </div>

      <MissionSlideOver mission={selectedMission} onClose={() => setSelectedMission(null)} editorOptions={detailOptions} />
      <SystemEntitySlideOver detail={selectedQuestItem ? { variant: "inventory", entity: selectedQuestItem } : null} onClose={() => setSelectedQuestItem(null)} onChange={(entity) => setSelectedQuestItem(entity as TlozQuestItem)} users={detailOptions.users} missions={detailOptions.missions} resources={[]} onNavigateMission={(mission) => { setSelectedQuestItem(null); setSelectedMission(mission); }} />
    </>
  );
}
