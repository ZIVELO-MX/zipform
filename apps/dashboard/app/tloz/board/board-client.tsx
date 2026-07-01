"use client";

import { useEffect, useState, useTransition } from "react";
import type { TlozEpisode, TlozMissionStatus, TlozProject, TlozQuestItem, TlozSeason, UserProfile } from "@zipform/types";
import { MissionBoard } from "../../../components/tloz/mission-views";
import { MissionSlideOver } from "../../../components/tloz/mission-slide-over";
import { toast } from "@zipform/ui";
import type { TlozMissionRecord } from "../../../lib/tloz-data";
import { patchMissionStatus } from "../actions";

export function BoardClient({ missions, allMissions, projects, seasons, episodes, users, questItems }: { missions: TlozMissionRecord[]; allMissions: TlozMissionRecord[]; projects: TlozProject[]; seasons: TlozSeason[]; episodes: TlozEpisode[]; users: UserProfile[]; questItems: TlozQuestItem[] }) {
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
        toast.success("Estado actualizado", { description: `La misión se movió a ${status}.` });
      } catch {
        setCurrentMissions(previousMissions);
        setError("No se pudo actualizar la Mission. Intenta de nuevo.");
        toast.error("No se pudo mover la misión", { description: "El Board volvió al estado anterior." });
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
        editorOptions={{ projects, seasons, episodes, users, missions: allMissions, questItems }}
        onMissionChange={updateMissionInView}
      />
    </>
  );
}
