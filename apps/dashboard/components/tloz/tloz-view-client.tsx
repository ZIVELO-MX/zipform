"use client";

import { useState } from "react";
import { MissionSlideOver } from "./mission-slide-over";
import type { TlozMissionRecord } from "../../lib/tloz-data";

type TlozViewClientProps = {
  children: (onSelect: (m: TlozMissionRecord) => void) => React.ReactNode;
};

export function TlozViewClient({ children }: TlozViewClientProps) {
  const [selectedMission, setSelectedMission] = useState<TlozMissionRecord | null>(null);

  return (
    <>
      {children(setSelectedMission)}
      <MissionSlideOver mission={selectedMission} onClose={() => setSelectedMission(null)} />
    </>
  );
}
