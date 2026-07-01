"use client";

import type { TlozEpisode, TlozMissionStatus, TlozProject, TlozQuestItem, TlozSeason, UserProfile } from "@zipform/types";
import type { TlozDashboardSummary, TlozMissionRecord } from "../../lib/tloz-data";
import type { MissionDetailOptions } from "../../components/tloz/mission-detail";
import { DashboardClient } from "./dashboard-client";
import { BoardClient } from "./board/board-client";
import { ListClient } from "./list/list-client";
import { TableClient } from "./table/table-client";
import { CalendarClient } from "./calendar/calendar-client";
import { TlozFilters } from "../../components/tloz/tloz-filters";
import { TlozViewHeader } from "../../components/tloz/tloz-shell";

type ViewRendererProps = {
  view: string;
  summary: TlozDashboardSummary | null;
  missions: TlozMissionRecord[];
  allMissions: TlozMissionRecord[];
  projects: TlozProject[];
  seasons: TlozSeason[];
  episodes: TlozEpisode[];
  users: UserProfile[];
  questItems: TlozQuestItem[];
  detailOptions: MissionDetailOptions;
};

const viewConfig: Record<string, { title: string; description: string }> = {
  dashboard: { title: "Dashboard", description: "Visión general del equipo · trabajo activo en todos los proyectos" },
  board: { title: "Board", description: "Flujo de trabajo del equipo · agrupado por estado" },
  list: { title: "Lista", description: "Todas las missions · agrupadas por estado" },
  table: { title: "Tabla", description: "Todas las missions · todas las propiedades" },
  calendar: { title: "Calendario", description: "Missions con fecha de vencimiento" },
};

export function TlozViewRenderer({
  view,
  summary,
  missions,
  allMissions,
  projects,
  seasons,
  episodes,
  users,
  questItems,
  detailOptions,
}: ViewRendererProps) {
  const config = viewConfig[view] ?? viewConfig.dashboard;

  if (view === "dashboard") {
    if (!summary) return null;
    return <DashboardClient summary={summary} detailOptions={detailOptions} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <TlozViewHeader title={config.title} description={config.description} showAudienceToggle={view === "board"}>
        <TlozFilters projects={projects} seasons={seasons} episodes={episodes} />
      </TlozViewHeader>
      <div className={view === "board" ? "min-h-0 min-w-0 flex-1 overflow-hidden px-[26px] pb-[26px] pt-1" : "tloz-scrl flex-1 overflow-auto px-[26px] pb-[26px]"}>
        {view === "board" ? (
          <BoardClient
            missions={missions}
            allMissions={allMissions}
            projects={projects}
            seasons={seasons}
            episodes={episodes}
            users={users}
            questItems={questItems}
          />
        ) : view === "list" ? (
          <ListClient missions={missions} />
        ) : view === "table" ? (
          <TableClient missions={missions} />
        ) : view === "calendar" ? (
          <CalendarClient missions={missions} />
        ) : (
          <ListClient missions={missions} />
        )}
      </div>
    </div>
  );
}
