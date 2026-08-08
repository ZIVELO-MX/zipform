"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { TlozFieldOption, TlozProject, TlozQuestItem, UserProfile } from "@tloz/types";
import type { TlozDashboardSummary, TlozMissionRecord } from "../../lib/tloz-data";
import type { MissionDetailOptions } from "../../components/tloz/mission-detail";
import { DashboardClient } from "./dashboard-client";
import { TlozViewHeader } from "../../components/tloz/tloz-shell";
import { useTlozViewState } from "../../components/tloz/tloz-view-state";
import { CreateNewEntityButton } from "../../components/tloz/tloz-create";
import {
  filterAndSortTlozRecords,
  tlozStatusRole,
} from "../../components/tloz/tloz-view-query";

const BoardClient = dynamic(() => import("./board/board-client").then((module) => module.BoardClient), { loading: ViewLoading });
const ListClient = dynamic(() => import("./list/list-client").then((module) => module.ListClient), { loading: ViewLoading });
const TableClient = dynamic(() => import("./table/table-client").then((module) => module.TableClient), { loading: ViewLoading });
const CalendarClient = dynamic(() => import("./calendar/calendar-client").then((module) => module.CalendarClient), { loading: ViewLoading });

function ViewLoading() {
  return <div className="min-h-40 animate-pulse rounded-2xl bg-carbon/[0.04]" aria-label="Cargando vista" />;
}

const viewConfig: Record<string, { title: string; description: string }> = {
  dashboard: { title: "Dashboard", description: "Visión general del equipo · trabajo activo en todos los proyectos" },
  board: { title: "Board", description: "Flujo de trabajo del equipo · agrupado por estado" },
  list: { title: "Lista", description: "Todas las missions · agrupadas por estado" },
  table: { title: "Tabla", description: "Todas las missions · todas las propiedades" },
  calendar: { title: "Calendario", description: "Missions con fecha de vencimiento" },
};

type ViewRendererProps = {
  summary: TlozDashboardSummary | null;
  missions: TlozMissionRecord[];
  allMissions: TlozMissionRecord[];
  projects: TlozProject[];
  users: UserProfile[];
  questItems: TlozQuestItem[];
  detailOptions: MissionDetailOptions;
  statusOptions?: TlozFieldOption[];
  hideProjectSections?: boolean;
};

export function TlozViewRenderer(props: ViewRendererProps) {
  const { summary, missions, allMissions, projects, users, questItems, detailOptions, statusOptions = [], hideProjectSections } = props;
  const { state } = useTlozViewState();
  const view = state.view;
  const config = viewConfig[view] ?? viewConfig.dashboard;
  const visibleMissions = useMemo(
    () => filterAndSortTlozRecords(
      missions,
      state,
      statusOptions,
      { defaultSort: "dependencies" },
    ),
    [missions, state, statusOptions],
  );

  if (view === "dashboard") {
    if (!summary) return null;
    const visibleIds = new Set(visibleMissions.map((mission) => mission.id));
    const filteredSummary = {
      ...summary,
      activeQuest: summary.activeQuest && visibleIds.has(summary.activeQuest.id) ? summary.activeQuest : null,
      activeSupportQuest: summary.activeSupportQuest && visibleIds.has(summary.activeSupportQuest.id) ? summary.activeSupportQuest : null,
      nowMissions: visibleMissions.filter((mission) => ["active", "blocked"].includes(tlozStatusRole(mission.status, statusOptions))),
      mainQuests: visibleMissions.filter((mission) => mission.type === "main_quest" && tlozStatusRole(mission.status, statusOptions) !== "done"),
      upcomingMissions: visibleMissions.filter((mission) => tlozStatusRole(mission.status, statusOptions) === "ready"),
      futureMissions: visibleMissions.filter((mission) => tlozStatusRole(mission.status, statusOptions) === "backlog"),
      projects: summary.projects.filter((project) => visibleMissions.some((mission) => mission.projectId === project.id)),
    };
    return <DashboardClient summary={filteredSummary} detailOptions={detailOptions} statusOptions={statusOptions} hideProjectSections={hideProjectSections} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <TlozViewHeader title={config.title} description={config.description} />
      <div className={view === "board" ? "min-h-0 min-w-0 flex-1 overflow-hidden px-[26px] pb-[26px] pt-1" : "tloz-scrl flex-1 overflow-auto px-0 pb-[26px] md:px-[26px]"}>
        {view === "board" ? (
          <BoardClient
            missions={visibleMissions}
            allMissions={allMissions}
            projects={projects}
            users={users}
            questItems={questItems}
            statusOptions={statusOptions}
          />
        ) : view === "list" ? (
          <ListClient missions={visibleMissions} grouping={state.grouping} statusOptions={statusOptions} />
        ) : view === "table" ? (
          <TableClient missions={visibleMissions} statusOptions={statusOptions} />
        ) : view === "calendar" ? (
          <CalendarClient missions={visibleMissions} />
        ) : (
          <ListClient missions={visibleMissions} grouping={state.grouping} statusOptions={statusOptions} />
        )}
        {view === "list" || view === "table" ? <CreateNewEntityButton /> : null}
      </div>
    </div>
  );
}
