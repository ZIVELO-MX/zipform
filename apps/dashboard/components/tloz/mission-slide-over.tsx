"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  Button,
  MetricProgress,
  SlideOver,
  StatusPill,
  ToneBadge,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@zipform/ui";
import type { TlozMissionRecord } from "../../lib/tloz-data";
import { missionStatusLabel, missionTypeLabel, missionTypeTone, resolveMissionIcon } from "./tloz-utils";
import { MissionInlineEditor, type MissionEditorOptions } from "./mission-inline-editor";

type MissionSlideOverProps = {
  mission: TlozMissionRecord | null;
  onClose: () => void;
  editorOptions?: MissionEditorOptions;
  onMissionChange?: (mission: TlozMissionRecord) => void;
};

export function MissionSlideOver({ mission, onClose, editorOptions, onMissionChange }: MissionSlideOverProps) {
  const open = Boolean(mission);

  if (!mission) {
    return <SlideOver open={false} title="Detalle de Mission" onOpenChange={(nextOpen) => !nextOpen && onClose()} />;
  }

  const tone = missionTypeTone[mission.type];
  const Icon = resolveMissionIcon(mission.icon);

  return (
    <SlideOver
      open={open}
      title="Detalle de Mission"
      onOpenChange={(nextOpen) => !nextOpen && onClose()}
      footer={
        <Button asChild className="h-[42px] flex-1 rounded-[11px] text-[13.5px] font-semibold">
          <Link href={`/tloz/missions/${mission.id}`}>
            <ExternalLink aria-hidden="true" />
            Ver detalle completo
          </Link>
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <ToneBadge tone={{ color: tone }} className="gap-1.5 text-[11px]">
              <Icon size={12} aria-hidden="true" />
              {missionTypeLabel[mission.type]}
            </ToneBadge>
            <StatusPill label={missionStatusLabel[mission.status]} color={mission.status === "blocked" ? "#B91C22" : "#1E8E5A"} active={mission.status === "now"} />
          </div>
          <h2 className="m-0 mb-2 text-[22px] font-bold leading-tight tracking-normal">{mission.title}</h2>
          <p className="m-0 text-[13.5px] leading-6 text-carbon/65">{mission.description}</p>
        </section>

        <MetricProgress value={mission.progress} label={`${mission.progress}% completo`} tone="#D72228" />

        <section aria-labelledby="mission-fields-heading">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <h3 id="mission-fields-heading" className="m-0 text-[12.5px] font-bold uppercase text-carbon/75">Campos</h3>
            <span className="text-[11px] text-carbon/45">Haz clic para editar</span>
          </div>
          <MissionInlineEditor mission={mission} options={editorOptions} onMissionChange={onMissionChange} />
        </section>

        {mission.questItems.length > 0 ? (
          <SlideSection title={`Quest Items (${mission.questItems.length})`}>
            {mission.questItems.map((item) => (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <div className="tloz-qi-hover flex cursor-pointer items-center gap-2.5 rounded-[11px] border border-carbon/10 bg-white px-3 py-2.5 transition-colors">
                    <span
                      className="grid size-7 shrink-0 place-items-center rounded-lg text-sm font-semibold"
                      style={{
                        backgroundColor: item.status === "completed" ? "#E6F4EA" : "#FFF4DE",
                        color: item.status === "completed" ? "#1E6B3C" : "#7A5A12",
                      }}
                    >
                      {item.icon.slice(0, 1)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold">{item.name}</span>
                      <span className="block truncate text-[11px] text-carbon/50">{item.description}</span>
                    </span>
                    <span
                      className="shrink-0 rounded-full px-2 py-1 text-[10px] font-bold"
                      style={{
                        backgroundColor: item.status === "completed" ? "#E6F4EA" : "#FFF4DE",
                        color: item.status === "completed" ? "#1E6B3C" : "#7A5A12",
                      }}
                    >
                      {item.status === "completed" ? "Desbloqueado" : "Bloqueado"}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            ))}
          </SlideSection>
        ) : null}

        {mission.dependencies.length > 0 ? (
          <SlideSection title={`Dependencias (${mission.dependencies.length})`}>
            {mission.dependencies.map((dep) => (
              <Link
                key={dep.id}
                href={`/tloz/missions/${dep.id}`}
                className="tloz-qi-hover flex items-center gap-2.5 rounded-[11px] border border-carbon/10 bg-white px-3 py-2.5 text-inherit transition-colors"
              >
                <span className="size-2 shrink-0 rounded-full bg-carbon/35" aria-hidden="true" />
                <span className="min-w-0 flex-1 text-[13px] font-semibold">{dep.title}</span>
                <span className="shrink-0 text-[10.5px] text-carbon/50">{dep.status}</span>
              </Link>
            ))}
          </SlideSection>
        ) : null}
      </div>
    </SlideOver>
  );
}

function SlideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="m-0 mb-2.5 text-[12.5px] font-bold uppercase tracking-normal text-carbon/75">{title}</h3>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}
