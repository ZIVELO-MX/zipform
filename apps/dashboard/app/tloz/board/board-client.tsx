"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { TlozFieldOption, TlozMissionStatus, TlozProject, TlozQuestItem, UserProfile } from "@tloz/types";
import { MissionBoard } from "../../../components/tloz/mission-views";
import { MissionSlideOver } from "../../../components/tloz/mission-slide-over";
import { toast } from "@tloz/ui";
import type { TlozMissionRecord } from "../../../lib/tloz-data";
import { patchMissionStatus } from "../actions";

export function BoardClient({ missions, allMissions, projects, users, questItems, statusOptions }: { missions: TlozMissionRecord[]; allMissions: TlozMissionRecord[]; projects: TlozProject[]; users: UserProfile[]; questItems: TlozQuestItem[]; statusOptions?: TlozFieldOption[] }) {
  const [currentMissions, setCurrentMissions] = useState(missions);
  const [selectedMission, setSelectedMission] = useState<TlozMissionRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const mutationInFlight = useRef(false);

  useEffect(() => setCurrentMissions(missions), [missions]);

  function moveMission(missionId: string, status: TlozMissionStatus) {
    if (mutationInFlight.current || pending) return;
    const previousStatus = currentMissions.find((mission) => mission.id === missionId)?.status;
    if (previousStatus === undefined || previousStatus === status) return;
    mutationInFlight.current = true;
    setError(null);
    setCurrentMissions((items) => items.map((mission) => mission.id === missionId ? { ...mission, status } : mission));
    setSelectedMission((mission) => mission?.id === missionId ? { ...mission, status } : mission);
    startTransition(async () => {
      try {
        const updated = await patchMissionStatus(missionId, status);
        updateMissionInView(updated);
        toast.success("Estado actualizado", { description: `La misión se movió a ${status}.` });
      } catch {
        setCurrentMissions((items) => items.map((mission) => mission.id === missionId ? { ...mission, status: previousStatus } : mission));
        setSelectedMission((current) => current?.id === missionId ? { ...current, status: previousStatus } : current);
        setError("No se pudo mover la misión. Intenta de nuevo.");
        toast.error("No se pudo mover la misión", { description: "El Board volvió al estado anterior." });
      } finally {
        mutationInFlight.current = false;
      }
    });
  }

  function updateMissionInView(updated: TlozMissionRecord) {
    setCurrentMissions((items) => items.map((mission) => mission.id === updated.id ? updated : mission));
    setSelectedMission((mission) => mission?.id === updated.id ? updated : mission);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {error ? <p role="alert" className="mb-3 shrink-0 text-sm font-semibold text-destructive">{error}</p> : null}
      <div className="min-h-0 flex-1"><MissionBoard missions={currentMissions} statusOptions={statusOptions} pending={pending} onSelect={setSelectedMission} onStatusChange={moveMission} /></div>
      <MissionSlideOver
        mission={selectedMission}
        onClose={() => setSelectedMission(null)}
        editorOptions={{ projects, users, missions: allMissions, questItems }}
        onMissionChange={updateMissionInView}
      />
    </div>
  );
}
