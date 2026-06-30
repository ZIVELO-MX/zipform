"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { TlozMissionStatus } from "@zipform/types";
import { MissionBoard } from "../../../components/tloz/mission-views";
import { MissionSlideOver } from "../../../components/tloz/mission-slide-over";
import type { TlozMissionRecord } from "../../../lib/tloz-data";
import { patchMissionStatus } from "../actions";

export function BoardClient({ missions }: { missions: TlozMissionRecord[] }) {
  const [selectedMission, setSelectedMission] = useState<TlozMissionRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [optimisticMissions, moveOptimistically] = useOptimistic(
    missions,
    (state, change: { id: string; status: TlozMissionStatus }) =>
      state.map((mission) => mission.id === change.id ? { ...mission, status: change.status } : mission)
  );

  function moveMission(missionId: string, status: TlozMissionStatus) {
    setError(null);
    startTransition(async () => {
      moveOptimistically({ id: missionId, status });
      try {
        await patchMissionStatus(missionId, status);
      } catch {
        setError("No se pudo actualizar la Mission. Intenta de nuevo.");
      }
    });
  }

  return (
    <>
      {error ? <p role="alert" className="mb-3 text-sm font-semibold text-destructive">{error}</p> : null}
      <MissionBoard missions={optimisticMissions} onSelect={setSelectedMission} onStatusChange={moveMission} />
      <MissionSlideOver mission={selectedMission} onClose={() => setSelectedMission(null)} />
    </>
  );
}
