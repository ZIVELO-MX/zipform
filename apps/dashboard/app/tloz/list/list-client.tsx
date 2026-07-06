"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { MissionList } from "../../../components/tloz/mission-views";
import { MissionSlideOver } from "../../../components/tloz/mission-slide-over";
import { useIsMobile } from "../../../hooks/use-is-mobile";
import type { TlozMissionRecord } from "../../../lib/tloz-data";
import type { TlozGrouping } from "../../../components/tloz/tloz-view-state";
import { missionHref } from "../../../lib/tloz-routes";

export function ListClient({ missions, grouping = "status" }: { missions: TlozMissionRecord[]; grouping?: TlozGrouping }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [selectedMission, setSelectedMission] = useState<TlozMissionRecord | null>(null);

  const handleSelect = useCallback((mission: TlozMissionRecord | null) => {
    if (!mission) return;
    if (isMobile && mission.project) {
      router.push(missionHref(mission.project, mission.displayId));
    } else {
      setSelectedMission(mission);
    }
  }, [isMobile, router]);

  return (
    <>
      <MissionList missions={missions} grouping={grouping} onSelect={handleSelect} />
      <MissionSlideOver mission={selectedMission} onClose={() => setSelectedMission(null)} />
    </>
  );
}
