"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { MissionTable } from "../../../components/tloz/mission-views";
import { MissionSlideOver } from "../../../components/tloz/mission-slide-over";
import { useIsMobile } from "../../../hooks/use-is-mobile";
import type { TlozMissionRecord } from "../../../lib/tloz-data";

export function TableClient({ missions }: { missions: TlozMissionRecord[] }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [selectedMission, setSelectedMission] = useState<TlozMissionRecord | null>(null);

  const handleSelect = useCallback((mission: TlozMissionRecord | null) => {
    if (!mission) return;
    if (isMobile) {
      router.push(`/tloz/${mission.project?.slug ?? mission.projectId}/${mission.id}`);
    } else {
      setSelectedMission(mission);
    }
  }, [isMobile, router]);

  return (
    <>
      <MissionTable missions={missions} onSelect={handleSelect} />
      <MissionSlideOver mission={selectedMission} onClose={() => setSelectedMission(null)} />
    </>
  );
}
