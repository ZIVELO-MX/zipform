"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ContentRecord } from "@tloz/types";

export function CanonicalContentDetail({ content, presentation }: { content: ContentRecord; presentation: "workshop" | "library" }) {
  const router = useRouter();
  const [draft, setDraft] = useState({ title: content.title, summary: content.summary, body: content.body });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function save() {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/v2/contents/${encodeURIComponent(content.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json", "If-Match": `"${content.revision}"` }, body: JSON.stringify(draft) });
      if (!response.ok) { setError("No se pudo guardar el contenido."); return; }
      router.refresh();
    });
  }
  function remove() {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/v2/contents/${encodeURIComponent(content.id)}`, { method: "DELETE", headers: { "If-Match": `"${content.revision}"` } });
      if (!response.ok) { setError("No se pudo eliminar el contenido."); return; }
      router.push(`/${presentation}`);
    });
  }
  return <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-5 md:p-8"><div className="rounded-xl border border-carbon/10 bg-white p-5"><p className="m-0 text-[10px] font-bold uppercase tracking-wide text-carbon/40">{presentation}</p><label className="mt-3 flex flex-col gap-1 text-[12px] font-semibold text-carbon/65">Título<input className="rounded-lg border border-carbon/15 px-3 py-2 text-base font-bold text-carbon" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label><label className="mt-3 flex flex-col gap-1 text-[12px] font-semibold text-carbon/65">Resumen<input className="rounded-lg border border-carbon/15 px-3 py-2 text-sm font-normal text-carbon" value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} /></label><label className="mt-3 flex flex-col gap-1 text-[12px] font-semibold text-carbon/65">Markdown<textarea className="min-h-48 rounded-lg border border-carbon/15 px-3 py-2 font-mono text-[13px] font-normal text-carbon" value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} /></label><div className="mt-4 flex gap-2"><button type="button" disabled={pending || !draft.title.trim()} onClick={save} className="rounded-lg bg-zivelo px-4 py-2 text-[12px] font-bold text-white disabled:opacity-50">Guardar</button><button type="button" disabled={pending} onClick={remove} className="rounded-lg border border-[#B91C22]/25 px-4 py-2 text-[12px] font-bold text-[#B91C22]">Eliminar</button></div>{error ? <p role="alert" className="mb-0 mt-3 text-[12px] font-semibold text-[#B91C22]">{error}</p> : null}</div></div>;
}
