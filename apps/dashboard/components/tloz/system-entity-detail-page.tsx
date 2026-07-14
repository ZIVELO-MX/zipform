"use client";

import { useState } from "react";
import type { TlozProject, TlozQuestItem, TlozResource, UserProfile } from "@zipform/types";
import type { TlozMissionRecord } from "../../lib/tloz-data";
import { MissionSlideOver } from "./mission-slide-over";
import { SystemEntityDetail } from "./system-project-detail";

type SystemEntityDetailPageProps = {
  variant: "project";
  entity: TlozProject;
  missions: TlozMissionRecord[];
  users: UserProfile[];
  resources: TlozResource[];
} | {
  variant: "inventory";
  entity: TlozQuestItem;
  missions: TlozMissionRecord[];
  users: UserProfile[];
  resources: TlozResource[];
};

export function SystemEntityDetailPage(props: SystemEntityDetailPageProps) {
  const [selectedMission, setSelectedMission] = useState<TlozMissionRecord | null>(null);
  const shared = { missions: props.missions, users: props.users, resources: props.resources, onNavigateMission: setSelectedMission };

  return <>
    {props.variant === "project"
      ? <SystemEntityDetail variant="project" entity={props.entity} {...shared} />
      : <SystemEntityDetail variant="inventory" entity={props.entity} {...shared} />}
    <MissionSlideOver mission={selectedMission} onClose={() => setSelectedMission(null)} />
  </>;
}
