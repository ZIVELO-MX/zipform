"use client";

import { useEffect, useState, useTransition } from "react";
import type { TlozEpisode, TlozMissionStatus, TlozProject } from "@zipform/types";
import { MissionBoard } from "../../../components/tloz/mission-views";
import { MissionSlideOver } from "../../../components/tloz/mission-slide-over";
import type { TlozMissionRecord } from "../../../lib/tloz-data";
import { patchMissionStatus } from "../actions";

export function BoardClient({ missions, projects, episodes }: { missions: TlozMissionRecord[]; projects: TlozProject[]; episodes: TlozEpisode[] }) {
  const [currentMissions, setCurrentMissions] = useState(missions);
  const [selectedMission, setSelectedMission] = useState<TlozMissionRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => setCurrentMissions(missions), [missions]);

  function moveMission(missionId: string, status: TlozMissionStatus) {
    setError(null);
    const previousMissions = currentMissions;
    setCurrentMissions((items) => items.map((mission) => mission.id === missionId ? { ...mission, status } : mission));
    setSelectedMission((mission) => mission?.id === missionId ? { ...mission, status } : mission);
    startTransition(async () => {
      try {
        const updated = await patchMissionStatus(missionId, status);
        updateMissionInView(updated);
      } catch {
        setCurrentMissions(previousMissions);
        setError("No se pudo actualizar la Mission. Intenta de nuevo.");
      }
    });
  }

  function updateMissionInView(updated: TlozMissionRecord) {
    setCurrentMissions((items) => items.map((mission) => mission.id === updated.id ? updated : mission));
    setSelectedMission((mission) => mission?.id === updated.id ? updated : mission);
  }

  return (
    <>
      {error ? <p role="alert" className="mb-3 text-sm font-semibold text-destructive">{error}</p> : null}
      <MissionBoard missions={currentMissions} onSelect={setSelectedMission} onStatusChange={moveMission} />
      <MissionSlideOver
        mission={selectedMission}
        onClose={() => setSelectedMission(null)}
        editorOptions={{ projects, episodes }}
        onMissionChange={updateMissionInView}
      />
    </>
  );
}
