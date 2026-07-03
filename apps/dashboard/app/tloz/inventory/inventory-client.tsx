"use client";

import { useState } from "react";
import { SlideOver } from "@zipform/ui";
import type { TlozQuestItem } from "@zipform/types";
import { resolveMissionIcon } from "../../../components/tloz/tloz-utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const statusLabel: Record<string, string> = { planned: "Planeado", active: "Activo", completed: "Desbloqueado", blocked: "Bloqueado", archived: "Archivado" };
const statusBadgeBg: Record<string, string> = { planned: "#EEF2FF", active: "#FFF4DE", completed: "#E6F4EA", blocked: "#FDECEC", archived: "#F0F0F0" };
const statusBadgeText: Record<string, string> = { planned: "#2D6CDF", active: "#7A5A12", completed: "#1E6B3C", blocked: "#B91C22", archived: "#6B6B6B" };

type ViewMode = "table" | "list";

export function InventoryClient({ questItems }: { questItems: TlozQuestItem[] }) {
  const [view, setView] = useState<ViewMode>("table");
  const [selected, setSelected] = useState<TlozQuestItem | null>(null);

  return (
    <>
      <div className="flex items-center justify-between gap-4 border-b border-carbon/10 px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-carbon/5 px-2.5 py-1 font-mono text-[13px] font-medium text-carbon/60">{questItems.length} items</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-carbon/5 p-0.5">
          <button type="button" className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${view === "table" ? "bg-white text-carbon shadow-sm" : "text-carbon/50 hover:text-carbon"}`} onClick={() => setView("table")}>Tabla</button>
          <button type="button" className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${view === "list" ? "bg-white text-carbon shadow-sm" : "text-carbon/50 hover:text-carbon"}`} onClick={() => setView("list")}>Lista</button>
        </div>
      </div>

      <div className="px-6 py-5">
        {view === "table" ? (
          <div className="overflow-hidden rounded-xl border border-carbon/10 bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-carbon/6 text-left text-[11.5px] font-bold uppercase tracking-[0.04em] text-carbon/55">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3">Adquirido</th>
                </tr>
              </thead>
              <tbody>
                {questItems.map((item) => {
                  const Icon = resolveMissionIcon(item.icon);
                  return (
                    <tr key={item.id} className="tloz-trow cursor-pointer border-b border-carbon/6 last:border-0" onClick={() => setSelected(item)}>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2.5 font-semibold text-carbon">
                          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#FFF4DE] text-[#7A5A12] [&_svg]:size-3.5"><Icon aria-hidden="true" /></span>
                          {item.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-full px-[9px] py-[3px] text-[11px] font-bold" style={{ background: statusBadgeBg[item.status], color: statusBadgeText[item.status] }}>{statusLabel[item.status]}</span>
                      </td>
                      <td className="max-w-[300px] truncate px-4 py-3 text-[13px] text-carbon/55">{item.description}</td>
                      <td className="px-4 py-3 font-mono text-[12px] text-carbon/55">{item.acquiredAt ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {questItems.map((item) => {
              const Icon = resolveMissionIcon(item.icon);
              return (
                <div key={item.id} className="tloz-card-hover cursor-pointer rounded-xl border border-carbon/10 bg-white p-4 transition-all" onClick={() => setSelected(item)}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#FFF4DE] text-[#7A5A12] [&_svg]:size-4"><Icon aria-hidden="true" /></span>
                    <span className="inline-block shrink-0 rounded-full px-[9px] py-[3px] text-[10.5px] font-bold" style={{ background: statusBadgeBg[item.status], color: statusBadgeText[item.status] }}>{statusLabel[item.status]}</span>
                  </div>
                  <p className="mb-1 mt-3 text-[14px] font-bold text-carbon">{item.name}</p>
                  <p className="line-clamp-2 text-[12px] leading-relaxed text-carbon/55">{item.description}</p>
                  {item.acquiredAt ? <p className="mt-2 text-[11px] text-carbon/40">Adquirido: {item.acquiredAt}</p> : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SlideOver open={Boolean(selected)} title={selected?.name ?? "Inventory"} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        {selected ? <InventoryDetail item={selected} /> : null}
      </SlideOver>
    </>
  );
}

function InventoryDetail({ item }: { item: TlozQuestItem }) {
  const Icon = resolveMissionIcon(item.icon);
  return (
    <article className="flex min-h-full flex-col gap-6 bg-[#FAFAF9] p-6">
      <div className="flex items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#FFF4DE] text-[#7A5A12] [&_svg]:size-5"><Icon aria-hidden="true" /></span>
        <div className="min-w-0">
          <h2 className="m-0 text-xl font-bold text-carbon">{item.name}</h2>
          <span className="mt-2 inline-block rounded-full px-[10px] py-[4px] text-[11.5px] font-bold" style={{ background: statusBadgeBg[item.status], color: statusBadgeText[item.status] }}>{statusLabel[item.status]}</span>
          {item.acquiredAt ? <p className="mt-2 font-mono text-[12px] text-carbon/45">Adquirido: {item.acquiredAt}</p> : null}
        </div>
      </div>
      <div className="rounded-xl border border-carbon/10 bg-white p-5">
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.05em] text-carbon/55">Propiedades</h3>
        <div className="space-y-2 text-[13px]">
          <div className="flex items-center justify-between">
            <span className="text-carbon/55">Estado</span>
            <span className="font-semibold text-carbon">{statusLabel[item.status]}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-carbon/55">Adquirido</span>
            <span className="font-mono text-carbon/70">{item.acquiredAt || "—"}</span>
          </div>
        </div>
      </div>
      <div className="prose prose-sm max-w-none rounded-xl border border-carbon/10 bg-white p-5 text-carbon/75">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.description || "*Sin descripción.*"}</ReactMarkdown>
      </div>
    </article>
  );
}
