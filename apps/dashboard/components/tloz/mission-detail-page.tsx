"use client";

import { useState } from "react";
import type { TlozMissionDetail, TlozMissionRecord } from "../../lib/tloz-data";
import type { TlozQuestItem } from "@zipform/types";
import { MissionDetail, type MissionDetailOptions } from "./mission-detail";
import { SystemEntitySlideOver } from "./system-project-detail";
import { MissionSlideOver } from "./mission-slide-over";

export function MissionDetailPage({ mission, options }: { mission: TlozMissionDetail; options: MissionDetailOptions }) {
  const [selectedItem, setSelectedItem] = useState<TlozQuestItem | null>(null);
  const [selectedMission, setSelectedMission] = useState<TlozMissionRecord | null>(null);
  return <>
    <MissionDetail mission={mission} options={options} onNavigateQuestItem={(id) => setSelectedItem(options.questItems.find((item) => item.id === id) ?? null)} />
    <SystemEntitySlideOver detail={selectedItem ? { variant: "inventory", entity: selectedItem } : null} onClose={() => setSelectedItem(null)} onChange={(entity) => setSelectedItem(entity as TlozQuestItem)} users={options.users} missions={options.missions} resources={[]} onNavigateMission={(item) => { setSelectedItem(null); setSelectedMission(item); }} />
    <MissionSlideOver mission={selectedMission} onClose={() => setSelectedMission(null)} editorOptions={options} />
  </>;
}
