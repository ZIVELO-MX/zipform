"use client";

import { useState } from "react";
import { MissionCalendar } from "../../../components/tloz/mission-views";
import { MissionSlideOver } from "../../../components/tloz/mission-slide-over";
import type { TlozMissionRecord } from "../../../lib/tloz-data";

export function CalendarClient({ missions }: { missions: TlozMissionRecord[] }) {
  const [selectedMission, setSelectedMission] = useState<TlozMissionRecord | null>(null);

  return (
    <>
      <MissionCalendar missions={missions} onSelect={setSelectedMission} />
      <MissionSlideOver mission={selectedMission} onClose={() => setSelectedMission(null)} />
    </>
  );
}
