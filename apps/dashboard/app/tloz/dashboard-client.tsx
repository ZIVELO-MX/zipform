"use client";

import { useState } from "react";
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
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "23px", fontWeight: 700, letterSpacing: "-0.02em" }}>Dashboard</h1>
            <p style={{ margin: "5px 0 0", color: "#6B6B6B", fontSize: "13.5px" }}>
              Visión general del equipo · trabajo activo en todos los proyectos · 4 personas
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ display: "inline-flex", background: "#F1F0EE", borderRadius: "999px", padding: "3px", gap: "2px" }}>
              <span style={{ padding: "6px 13px", borderRadius: "999px", fontSize: "12.5px", fontWeight: 600, background: "#fff", color: "#1D1D1B", boxShadow: "0 1px 2px rgba(29,29,27,0.07)" }}>
                Todo el equipo
              </span>
              <span style={{ padding: "6px 13px", borderRadius: "999px", fontSize: "12.5px", fontWeight: 500, color: "#6B6B6B", cursor: "pointer" }}>
                Solo yo
              </span>
            </div>
          </div>
        </div>

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
