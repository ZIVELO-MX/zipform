"use client";

import { useState } from "react";
import { MissionCalendar } from "../../../components/tloz/mission-views";
import { MissionSlideOver } from "../../../components/tloz/mission-slide-over";
import type { TlozFieldOption } from "@tloz/types";
import type { TlozMissionRecord } from "../../../lib/tloz-data";

export function CalendarClient({ missions, statusOptions = [] }: { missions: TlozMissionRecord[]; statusOptions?: TlozFieldOption[] }) {
  const [selectedMission, setSelectedMission] = useState<TlozMissionRecord | null>(null);

  return (
    <>
      <MissionCalendar missions={missions} statusOptions={statusOptions} onSelect={setSelectedMission} />
      <MissionSlideOver mission={selectedMission} onClose={() => setSelectedMission(null)} />
    </>
  );
}
