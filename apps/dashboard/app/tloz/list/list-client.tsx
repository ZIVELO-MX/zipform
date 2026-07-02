"use client";

import { useState } from "react";
import { MissionList } from "../../../components/tloz/mission-views";
import { MissionSlideOver } from "../../../components/tloz/mission-slide-over";
import type { TlozMissionRecord } from "../../../lib/tloz-data";
import type { TlozGrouping } from "../../../components/tloz/tloz-view-state";

export function ListClient({ missions, grouping = "status" }: { missions: TlozMissionRecord[]; grouping?: TlozGrouping }) {
  const [selectedMission, setSelectedMission] = useState<TlozMissionRecord | null>(null);

  return (
    <>
      <MissionList missions={missions} grouping={grouping} onSelect={setSelectedMission} />
      <MissionSlideOver mission={selectedMission} onClose={() => setSelectedMission(null)} />
    </>
  );
}
