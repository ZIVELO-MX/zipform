"use client";

import { useState } from "react";
import { File, FileText, Link2, StickyNote } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@zipform/ui";
import type { TlozProject, TlozResource } from "@zipform/types";
import type { TlozMissionRecord } from "../../../../lib/tloz-data";
import { MissionSlideOver } from "../../../../components/tloz/mission-slide-over";
import { missionTypeLabel } from "../../../../components/tloz/tloz-utils";

const statusLabel: Record<string, string> = { planned: "Planeado", active: "Activo", completed: "Completado", blocked: "Bloqueado", archived: "Archivado" };
const resourceIcons: Record<string, typeof FileText> = { link: Link2, document: FileText, image: File, file: File, note: StickyNote };
const resourceLabels: Record<string, string> = { link: "Enlace", document: "Documento", image: "Imagen", file: "Archivo", note: "Nota" };

export function ProjectDetail({ project, missions, resources }: { project: TlozProject; missions: TlozMissionRecord[]; resources: TlozResource[] }) {
  const [selectedMission, setSelectedMission] = useState<TlozMissionRecord | null>(null);

  return (
    <>
      <div className="px-6 py-6">
        <div className="mb-8 flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-carbon shadow-sm ring-1 ring-carbon/10 [&_svg]:size-6" style={{ color: project.color }}>
            {project.icon.slice(0, 2)}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="m-0 text-2xl font-bold text-carbon">{project.name}</h1>
              <span className="inline-block rounded-full px-[10px] py-[4px] text-[11px] font-bold" style={{ background: project.status === "active" ? "#E6F4EA" : "#F0EFED", color: project.status === "active" ? "#1E6B3C" : "#6B6B6B" }}>{statusLabel[project.status]}</span>
            </div>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-carbon/60">{project.description || "Sin descripción."}</p>
            <div className="mt-4 flex items-center gap-5 text-[13px] text-carbon/55">
              <span className="font-mono font-medium">{missions.length} misiones</span>
              <span className="font-mono font-medium">{resources.length} recursos</span>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <section>
            <h2 className="mb-4 text-[13px] font-bold uppercase tracking-[0.05em] text-carbon/55">Misiones</h2>
            <div className="overflow-hidden rounded-xl border border-carbon/10 bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-carbon/6 text-left text-[11.5px] font-bold uppercase tracking-[0.04em] text-carbon/55">
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Dependencias</th>
                  </tr>
                </thead>
                <tbody>
                  {missions.map((mission) => (
                    <tr key={mission.id} className="tloz-trow cursor-pointer border-b border-carbon/6 last:border-0" onClick={() => setSelectedMission(mission)}>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2 font-semibold text-carbon">
                          <span className="font-mono text-[10.5px] text-carbon/40">{mission.displayId}</span>
                          {mission.title}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-full bg-carbon/5 px-2.5 py-1 text-[11px] font-semibold text-carbon/60">{missionTypeLabel[mission.type]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={mission.status} />
                      </td>
                      <td className="px-4 py-3 text-[13px] text-carbon/55">
                        {mission.dependencies.length > 0 ? `${mission.dependencies.length} dependencia${mission.dependencies.length > 1 ? "s" : ""}` : "—"}
                      </td>
                    </tr>
                  ))}
                  {missions.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-carbon/40">No hay misiones en este proyecto.</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-[13px] font-bold uppercase tracking-[0.05em] text-carbon/55">Recursos</h2>
            {resources.length > 0 ? (
              <div className="flex flex-col gap-2">
                {resources.map((resource) => {
                  const Icon = resourceIcons[resource.type] || FileText;
                  return (
                    <div key={resource.id} className="flex items-center gap-3 rounded-xl border border-carbon/10 bg-white px-4 py-3 transition-colors hover:border-carbon/20">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-carbon/5 text-carbon/60 [&_svg]:size-4"><Icon aria-hidden="true" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="m-0 truncate text-[13px] font-semibold text-carbon">{resource.title}</p>
                        <p className="m-0 text-[11px] text-carbon/45">{resourceLabels[resource.type]}</p>
                      </div>
                      {resource.url ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-carbon/40 hover:text-carbon" onClick={(e) => e.stopPropagation()}>
                              <Link2 size="14" aria-hidden="true" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent side="top">Abrir recurso</TooltipContent>
                        </Tooltip>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-carbon/15 p-6 text-center text-sm text-carbon/40">No hay recursos vinculados a este proyecto.</p>
            )}
          </section>
        </div>
      </div>

      <MissionSlideOver mission={selectedMission} onClose={() => setSelectedMission(null)} />
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const bg: Record<string, string> = { now: "#E6F4EA", next: "#EEF2FF", later: "#F2EAFE", blocked: "#FDECEC", completed: "#F0EFED" };
  const text: Record<string, string> = { now: "#1E8E5A", next: "#2D6CDF", later: "#7A4ED9", blocked: "#B91C22", completed: "#6B6B6B" };
  const label: Record<string, string> = { now: "Now", next: "Next", later: "Later", blocked: "Blocked", completed: "Done" };
  return <span className="inline-block rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: bg[status] || "#F0EFED", color: text[status] || "#6B6B6B" }}>{label[status] || status}</span>;
}
