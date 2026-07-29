"use client";

import { useState } from "react";
import type { TlozMissionDetail, TlozMissionRecord } from "../../lib/tloz-data";
import type { TlozQuestItem } from "@tloz/types";
import type { MissionDetailOptions } from "./mission-detail";
import { DocumentDetail } from "./document-view-renderer";
import { SystemEntitySlideOver } from "./system-project-detail";
import { MissionSlideOver } from "./mission-slide-over";

export function MissionDetailPage({ mission, options, canUpdate, canMove }: { mission: TlozMissionDetail; options: MissionDetailOptions; canUpdate: boolean; canMove: boolean }) {
  const [selectedItem, setSelectedItem] = useState<TlozQuestItem | null>(null);
  const [selectedMission, setSelectedMission] = useState<TlozMissionRecord | null>(null);
  return <>
    <DocumentDetail mission={mission} options={options} canUpdate={canUpdate} canMove={canMove} onNavigateQuestItem={(id) => setSelectedItem(options.questItems.find((item) => item.id === id) ?? null)} />
    <SystemEntitySlideOver detail={selectedItem ? { variant: "inventory", entity: selectedItem } : null} onClose={() => setSelectedItem(null)} onChange={(entity) => setSelectedItem(entity as TlozQuestItem)} users={options.users} missions={options.missions} resources={[]} onNavigateMission={(item) => { setSelectedItem(null); setSelectedMission(item); }} />
    <MissionSlideOver mission={selectedMission} onClose={() => setSelectedMission(null)} editorOptions={options} />
  </>;
}
