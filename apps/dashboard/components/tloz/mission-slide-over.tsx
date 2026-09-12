"use client";

import { useEffect, useRef, useState } from "react";
import { Button, SlideOver, toast } from "@tloz/ui";
import type { TlozMissionDetail, TlozMissionRecord } from "../../lib/tloz-data";
import type { TlozQuestItem } from "@tloz/types";
import { getMissionPanelData } from "../../app/tloz/actions";
import type { MissionDetailOptions } from "./mission-detail";
import { DocumentDetail } from "./document-view-renderer";
import { SystemDocumentDetail } from "./system-project-detail";

type PanelHistory = { detail: TlozMissionDetail; options: MissionDetailOptions | null; canUpdate: boolean; canMove: boolean };

type MissionSlideOverProps = {
  mission: TlozMissionRecord | null;
  onClose: () => void;
  editorOptions?: Partial<MissionDetailOptions>;
  onMissionChange?: (mission: TlozMissionRecord) => void;
};

export function MissionSlideOver({ mission, onClose, editorOptions, onMissionChange }: MissionSlideOverProps) {
  const [detail, setDetail] = useState<TlozMissionDetail | null>(null);
  const [history, setHistory] = useState<PanelHistory[]>([]);
  const [loadedOptions, setLoadedOptions] = useState<MissionDetailOptions | null>(null);
  const [selectedQuestItem, setSelectedQuestItem] = useState<TlozQuestItem | null>(null);
  const [canUpdate, setCanUpdate] = useState(false);
  const [canMove, setCanMove] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const navigationRequest = useRef(0);

  useEffect(() => {
    let active = true;
    setError(false);
    setDetail(null);
    setHistory([]);
    setSelectedQuestItem(null);
    setCanUpdate(false);
    setCanMove(false);
    if (mission) getMissionPanelData(mission.id, !editorOptions).then((result) => {
      if (active) {
        setDetail(result.mission);
        setCanUpdate(result.capabilities.canUpdate);
        setCanMove(result.capabilities.canMove);
        setLoadedOptions({
          projects: editorOptions?.projects ?? result.options?.projects ?? (mission.project ? [mission.project] : []),
          users: editorOptions?.users ?? result.options?.users ?? [mission.owner],
          missions: editorOptions?.missions ?? result.options?.missions ?? [mission],
          questItems: editorOptions?.questItems ?? result.options?.questItems ?? mission.questItems,
          document: result.document ?? undefined,
          contract: result.contract,
        });
      }
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; navigationRequest.current += 1; };
  }, [mission?.id, Boolean(editorOptions), attempt]);

  const options: MissionDetailOptions = {
    projects: editorOptions?.projects ?? loadedOptions?.projects ?? (mission?.project ? [mission.project] : []),
    users: editorOptions?.users ?? loadedOptions?.users ?? (mission ? [mission.owner] : []),
    missions: editorOptions?.missions ?? loadedOptions?.missions ?? (mission ? [mission] : []),
    questItems: editorOptions?.questItems ?? loadedOptions?.questItems ?? mission?.questItems ?? [],
    document: loadedOptions?.document ?? editorOptions?.document,
    contract: loadedOptions?.contract ?? editorOptions?.contract ?? [],
  };

  async function navigateToMission(missionId: string) {
    const request = ++navigationRequest.current;
    const previous = detail ? { detail, options: loadedOptions, canUpdate, canMove } : null;
    try {
      const result = await getMissionPanelData(missionId, false);
      if (request !== navigationRequest.current) return;
      if (previous) setHistory((items) => [...items, previous]);
      setDetail(result.mission);
      setCanUpdate(result.capabilities.canUpdate);
      setCanMove(result.capabilities.canMove);
      setLoadedOptions({ ...options, document: result.document ?? undefined, contract: result.contract });
    } catch {
      if (request === navigationRequest.current) toast.error("No se pudo abrir la misión. Intenta nuevamente.");
    }
  }

  function navigateBack() {
    navigationRequest.current += 1;
    if (selectedQuestItem) { setSelectedQuestItem(null); return; }
    const previous = history.at(-1);
    if (!previous) return;
    setDetail(previous.detail);
    setLoadedOptions(previous.options);
    setCanUpdate(previous.canUpdate);
    setCanMove(previous.canMove);
    setHistory((items) => items.slice(0, -1));
  }

  return (
    <SlideOver open={Boolean(mission)} title={selectedQuestItem?.name ?? detail?.title ?? mission?.title ?? "Detalle de Mission"} onBack={selectedQuestItem || history.length ? navigateBack : undefined} onOpenChange={(open) => !open && onClose()}>
      {error ? <div className="flex flex-col items-start gap-3 p-6" role="alert"><p className="m-0 text-sm font-semibold text-zivelo">No se pudo cargar la misión.</p><Button type="button" variant="outline" size="sm" onClick={() => setAttempt((value) => value + 1)}>Reintentar</Button></div> : selectedQuestItem ? <SystemDocumentDetail entityId={selectedQuestItem.id} users={options.users} panel /> : detail ? <div className="min-h-full bg-[#FAFAF9]"><DocumentDetail panel mission={detail} options={options} canUpdate={canUpdate} canMove={canMove} onNavigateMission={(id) => void navigateToMission(id)} onNavigateQuestItem={(id) => { const item = options.questItems.find((quest) => quest.id === id); if (item) setSelectedQuestItem(item); }} onMissionChange={onMissionChange} /></div> : <div className="flex min-h-40 items-center justify-center gap-2 p-6 text-sm text-carbon/50" role="status" aria-live="polite"><span className="size-4 animate-spin rounded-full border-2 border-carbon/20 border-t-carbon/70" aria-hidden="true" />Cargando misión…</div>}
    </SlideOver>
  );
}
