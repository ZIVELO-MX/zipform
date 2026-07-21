"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SlideOver } from "@zipform/ui";
import type { TlozMissionDetail, TlozMissionRecord } from "../../lib/tloz-data";
import type { TlozQuestItem } from "@zipform/types";
import { getMissionCapabilities, getMissionDetail, getMissionDetailOptions } from "../../app/tloz/actions";
import { inventoryItemHref } from "../../lib/tloz-routes";
import { MissionDetail, type MissionDetailOptions } from "./mission-detail";
import { SystemEntityDetail } from "./system-project-detail";

type MissionSlideOverProps = {
  mission: TlozMissionRecord | null;
  onClose: () => void;
  editorOptions?: Partial<MissionDetailOptions>;
  onMissionChange?: (mission: TlozMissionRecord) => void;
};

export function MissionSlideOver({ mission, onClose, editorOptions, onMissionChange }: MissionSlideOverProps) {
  const [detail, setDetail] = useState<TlozMissionDetail | null>(null);
  const [history, setHistory] = useState<TlozMissionDetail[]>([]);
  const [loadedOptions, setLoadedOptions] = useState<MissionDetailOptions | null>(null);
  const [selectedQuestItem, setSelectedQuestItem] = useState<TlozQuestItem | null>(null);
  const [canUpdate, setCanUpdate] = useState(false);

  useEffect(() => {
    let active = true;
    setDetail(null);
    setHistory([]);
    setSelectedQuestItem(null);
    setCanUpdate(false);
    if (mission) Promise.all([getMissionDetail(mission.id), editorOptions ? Promise.resolve(null) : getMissionDetailOptions(), getMissionCapabilities(mission.id)]).then(([result, options, capabilities]) => {
      if (active) { setDetail(result); setCanUpdate(capabilities.canUpdate); if (options) setLoadedOptions(options); }
    });
    return () => { active = false; };
  }, [mission]);

  const options: MissionDetailOptions = {
    projects: editorOptions?.projects ?? loadedOptions?.projects ?? (mission?.project ? [mission.project] : []),
    seasons: editorOptions?.seasons ?? loadedOptions?.seasons ?? (mission?.season ? [mission.season] : []),
    episodes: editorOptions?.episodes ?? loadedOptions?.episodes ?? (mission?.episode ? [mission.episode] : []),
    users: editorOptions?.users ?? loadedOptions?.users ?? (mission ? [mission.owner] : []),
    missions: editorOptions?.missions ?? loadedOptions?.missions ?? (mission ? [mission] : []),
    questItems: editorOptions?.questItems ?? loadedOptions?.questItems ?? mission?.questItems ?? [],
  };

  async function navigateToMission(missionId: string) {
    if (detail) setHistory((items) => [...items, detail]);
    setDetail(null);
    setDetail(await getMissionDetail(missionId));
    setCanUpdate((await getMissionCapabilities(missionId)).canUpdate);
  }

  function navigateBack() {
    if (selectedQuestItem) { setSelectedQuestItem(null); return; }
    setHistory((items) => {
      const previous = items.at(-1);
      if (previous) setDetail(previous);
      return items.slice(0, -1);
    });
  }

  const router = useRouter();

  return (
    <SlideOver open={Boolean(mission)} title={selectedQuestItem?.name ?? detail?.title ?? mission?.title ?? "Detalle de Mission"} onBack={selectedQuestItem || history.length ? navigateBack : undefined} onOpenChange={(open) => !open && onClose()}>
      {selectedQuestItem ? <SystemEntityDetail variant="inventory" entity={selectedQuestItem} missions={options.missions} users={options.users} resources={[]} panel onChange={(entity) => setSelectedQuestItem(entity as TlozQuestItem)} onNavigateMission={(item) => void navigateToMission(item.id)} onOpenFullPage={() => { onClose(); router.push(inventoryItemHref(selectedQuestItem.id)); }} /> : detail ? <div className="min-h-full bg-[#FAFAF9]"><MissionDetail variant="panel" mission={detail} options={options} canUpdate={canUpdate} onNavigateMission={(id) => void navigateToMission(id)} onNavigateQuestItem={(id) => { const item = options.questItems.find((quest) => quest.id === id); if (item) setSelectedQuestItem(item); }} onMissionChange={onMissionChange} /></div> : <div className="flex min-h-40 items-center justify-center gap-2 p-6 text-sm text-carbon/50" role="status" aria-live="polite"><span className="size-4 animate-spin rounded-full border-2 border-carbon/20 border-t-carbon/70" aria-hidden="true" />Cargando misión…</div>}
    </SlideOver>
  );
}
