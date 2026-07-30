"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ContainerRecord, ContentRecord } from "@tloz/types";

export function CanonicalContentCollection({ container, initialContents, presentation }: { container: ContainerRecord; initialContents: ContentRecord[]; presentation: "workshop" | "library" }) {
  const router = useRouter();
  const [contents, setContents] = useState(initialContents);
  const [draft, setDraft] = useState({ title: "", summary: "", body: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ title: "", summary: "" });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const label = presentation === "workshop" ? "idea" : "documento";
  function create() {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/v2/contents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ containerId: container.id, publicId: `${presentation}-${crypto.randomUUID()}`, presentation, title: draft.title, summary: draft.summary, body: draft.body, data: {} }) });
      if (!response.ok) { setError("No se pudo crear el contenido."); return; }
      setDraft({ title: "", summary: "", body: "" });
      router.refresh();
    });
  }
  function remove(content: ContentRecord) {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/v2/contents/${encodeURIComponent(content.id)}`, { method: "DELETE", headers: { "If-Match": `"${content.revision}"` } });
      if (!response.ok) { setError("No se pudo eliminar el contenido."); return; }
      setContents((current) => current.filter((item) => item.id !== content.id));
    });
  }
  function save(content: ContentRecord) {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/v2/contents/${encodeURIComponent(content.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json", "If-Match": `"${content.revision}"` }, body: JSON.stringify(editDraft) });
      if (!response.ok) { setError("No se pudo actualizar el contenido."); return; }
      const payload = await response.json() as { data: ContentRecord };
      setContents((current) => current.map((item) => item.id === content.id ? payload.data : item));
      setEditing(null);
    });
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-5 md:p-7">
      <div className="grid gap-3 rounded-xl border border-carbon/10 bg-white p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-carbon/65">Título<input className="rounded-lg border border-carbon/15 px-3 py-2 text-sm font-normal text-carbon" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-carbon/65">Resumen<input className="rounded-lg border border-carbon/15 px-3 py-2 text-sm font-normal text-carbon" value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} /></label>
        <button type="button" disabled={pending || !draft.title.trim()} onClick={create} className="rounded-lg bg-zivelo px-4 py-2 text-[12px] font-bold text-white disabled:opacity-50">Crear {label}</button>
      </div>
      {error ? <p role="alert" className="m-0 text-[12px] font-semibold text-[#B91C22]">{error}</p> : null}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {contents.map((content) => <article key={content.id} className="rounded-xl border border-carbon/10 bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1">{editing === content.id ? <div className="grid gap-2"><input aria-label="Título" className="rounded-lg border border-carbon/15 px-2 py-1 text-[13px] font-semibold" value={editDraft.title} onChange={(event) => setEditDraft({ ...editDraft, title: event.target.value })} /><input aria-label="Resumen" className="rounded-lg border border-carbon/15 px-2 py-1 text-[12px]" value={editDraft.summary} onChange={(event) => setEditDraft({ ...editDraft, summary: event.target.value })} /><div className="flex gap-2"><button type="button" disabled={pending || !editDraft.title.trim()} onClick={() => save(content)} className="text-[11px] font-bold text-zivelo">Guardar</button><button type="button" onClick={() => setEditing(null)} className="text-[11px] font-semibold text-carbon/50">Cancelar</button></div></div> : <><h2 className="m-0 truncate text-[14px] font-bold text-carbon">{content.title}</h2><p className="mt-1 line-clamp-2 text-[12px] text-carbon/55">{content.summary || "Sin resumen"}</p></>}</div><div className="flex shrink-0 gap-2">{editing !== content.id ? <button type="button" disabled={pending} onClick={() => { setEditing(content.id); setEditDraft({ title: content.title, summary: content.summary }); }} className="text-[11px] font-bold text-zivelo">Editar</button> : null}<button type="button" disabled={pending} onClick={() => remove(content)} className="text-[11px] font-bold text-[#B91C22]">Eliminar</button></div></div><p className="mt-3 mb-0 text-[10px] font-semibold uppercase tracking-wide text-carbon/35">{content.presentation}</p></article>)}
      </div>
      {contents.length === 0 ? <p className="m-0 rounded-xl border border-dashed border-carbon/15 p-8 text-center text-[13px] text-carbon/50">No hay {label}s todavía.</p> : null}
    </div>
  );
}
