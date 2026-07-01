"use client";

import { useEffect, useState } from "react";
import { Badge, SlideOver } from "@zipform/ui";
import type { TlozMissionDetail, TlozMissionRecord } from "../../lib/tloz-data";
import type { TlozQuestItem } from "@zipform/types";
import { getMissionDetail, getMissionDetailOptions } from "../../app/tloz/actions";
import { MissionDetail, type MissionDetailOptions } from "./mission-detail";
import { resolveMissionIcon } from "./tloz-utils";

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

  useEffect(() => {
    let active = true;
    setDetail(null);
    setHistory([]);
    setSelectedQuestItem(null);
    if (mission) Promise.all([getMissionDetail(mission.id), editorOptions ? Promise.resolve(null) : getMissionDetailOptions()]).then(([result, options]) => {
      if (active) { setDetail(result); if (options) setLoadedOptions(options); }
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
  }

  function navigateBack() {
    if (selectedQuestItem) { setSelectedQuestItem(null); return; }
    setHistory((items) => {
      const previous = items.at(-1);
      if (previous) setDetail(previous);
      return items.slice(0, -1);
    });
  }

  return (
    <SlideOver open={Boolean(mission)} title={selectedQuestItem?.name ?? detail?.title ?? mission?.title ?? "Detalle de Mission"} onBack={selectedQuestItem || history.length ? navigateBack : undefined} onOpenChange={(open) => !open && onClose()}>
      {selectedQuestItem ? <QuestItemPanel item={selectedQuestItem} /> : detail ? <div className="min-h-full bg-[#FAFAF9]"><MissionDetail mission={detail} options={options} onNavigateMission={(id) => void navigateToMission(id)} onNavigateQuestItem={(id) => { const item = options.questItems.find((quest) => quest.id === id); if (item) setSelectedQuestItem(item); }} onMissionChange={onMissionChange} /></div> : <p className="p-6 text-sm text-carbon/50">Cargando misión…</p>}
    </SlideOver>
  );
}

function QuestItemPanel({ item }: { item: TlozQuestItem }) {
  const Icon = resolveMissionIcon(item.icon);
  return <article className="min-h-full bg-[#FAFAF9] p-6"><div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#FFF4DE] text-[#7A5A12] [&_svg]:size-3.5"><Icon aria-hidden="true" /></span><div className="min-w-0"><h2 className="m-0 text-xl font-bold text-carbon">{item.name}</h2><Badge className="mt-2" variant={item.status === "completed" ? "success" : "muted"}>{item.status === "completed" ? "Desbloqueado" : "Bloqueado"}</Badge></div></div><p className="mt-5 text-sm leading-6 text-carbon/65">{item.description || "Sin descripción."}</p></article>;
}
