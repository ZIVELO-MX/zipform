"use client";

import { useState } from "react";
import { MissionBoard } from "../../../components/tloz/mission-views";
import { MissionSlideOver } from "../../../components/tloz/mission-slide-over";
import type { TlozMissionRecord } from "../../../lib/tloz-data";

export function BoardClient({ missions }: { missions: TlozMissionRecord[] }) {
  const [selectedMission, setSelectedMission] = useState<TlozMissionRecord | null>(null);

  return (
    <>
      <MissionBoard missions={missions} onSelect={setSelectedMission} />
      <MissionSlideOver mission={selectedMission} onClose={() => setSelectedMission(null)} />
    </>
  );
}
