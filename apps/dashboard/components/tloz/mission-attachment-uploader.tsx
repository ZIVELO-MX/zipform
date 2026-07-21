"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { FileImage, RefreshCw, Upload } from "lucide-react";
import { Button, ResourcePreview, type ResourcePreviewSlide } from "@zipform/ui";
import type { TlozAttachmentGroup, TlozResource } from "@zipform/types";
import {
  AttachmentClientError,
  createAttachmentGroupKey,
  createAttachmentRevision,
  finalizeAttachmentBatch,
  fetchExistingAttachment,
  formatAttachmentSize,
  prepareAttachmentBatch,
  toAttachmentItem,
  uploadAttachmentFile,
  validateAttachmentCount,
} from "../../lib/tloz-attachments-client";
import { attachmentStateReducer, emptyAttachmentState, type AttachmentItemState } from "./mission-attachment-state";

type MissionAttachmentUploaderProps = {
  missionId: string;
  resources: TlozResource[];
  canUpdate: boolean;
  onGroupCompleted: (group: TlozAttachmentGroup) => void;
};

function isAttachmentResource(resource: TlozResource): resource is TlozResource & { groupKey: string; externalKey: string; url: string } {
  return Boolean(resource.groupKey && resource.externalKey && resource.contentType);
}

function errorMessage(error: unknown) {
  return error instanceof AttachmentClientError ? error.message : "No se pudo preparar la selección.";
}

export function MissionAttachmentUploader({ missionId, resources, canUpdate, onGroupCompleted }: MissionAttachmentUploaderProps) {
  const [state, dispatch] = useStateReducer();
  const [selectionError, setSelectionError] = useState<string>();
  const [replaceResource, setReplaceResource] = useState<(TlozResource & { groupKey: string; externalKey: string; url: string }) | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const announcement = state.status === "completed" ? "Capturas publicadas." : state.status === "error" ? state.error ?? "La carga tiene errores." : state.status === "uploading" ? "Subiendo capturas." : "";

  const groups = useMemo(() => {
    const map = new Map<string, (TlozResource & { groupKey: string; externalKey: string; url: string })[]>();
    for (const resource of resources) {
      if (!isAttachmentResource(resource)) continue;
      const items = map.get(resource.groupKey) ?? [];
      items.push(resource);
      map.set(resource.groupKey, items);
    }
    return [...map.entries()].map(([groupKey, items]) => ({ groupKey, items }));
  }, [resources]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function selectFiles(fileList: FileList | null) {
    const files = fileList ? [...fileList] : [];
    if (!files.length) return;
    setSelectionError(undefined);
    void (async () => {
      try {
        const items = await Promise.all(files.map((file) => toAttachmentItem(file)));
        validateAttachmentCount(items);
        const groupKey = createAttachmentGroupKey();
        const sourceRevision = createAttachmentRevision();
        dispatch({ type: "select", groupKey, sourceRevision, items });
        await executeUpload(items, groupKey, sourceRevision, new Set());
      } catch (error) {
        if (error instanceof AttachmentClientError && error.stage === "validate") setSelectionError(error.message);
        else dispatch({ type: "error", message: errorMessage(error) });
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    })();
  }

  async function executeUpload(items: AttachmentItemState[] | Awaited<ReturnType<typeof toAttachmentItem>>[], groupKey: string, sourceRevision: string, alreadyUploaded: Set<string>) {
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    try {
      dispatch({ type: "preparing" });
      const manifest = {
        groupKey,
        sourceRevision,
        files: items.map((item) => ({ key: item.key, title: item.title, fileName: item.fileName, contentType: item.contentType, sizeBytes: item.sizeBytes, width: item.width, height: item.height })),
      };
      const batch = await prepareAttachmentBatch(missionId, manifest, controller.signal);
      dispatch({ type: "prepared", uploadBatchId: batch.uploadBatchId });
      const failures: string[] = [];
      await Promise.all(items.map(async (item) => {
        if (alreadyUploaded.has(item.key)) return;
        const upload = batch.uploads.find((candidate) => candidate.key === item.key);
        if (!upload) {
          failures.push(item.key);
          dispatch({ type: "file-error", key: item.key, message: "La API no devolvió una URL para esta captura." });
          return;
        }
        dispatch({ type: "uploading", key: item.key });
        try {
          await uploadAttachmentFile(upload, item.file, controller.signal);
          dispatch({ type: "uploaded", key: item.key });
        } catch (error) {
          failures.push(item.key);
          if (!controller.signal.aborted) dispatch({ type: "file-error", key: item.key, message: errorMessage(error) });
        }
      }));
      if (controller.signal.aborted) return;
      if (failures.length) return;
      dispatch({ type: "finalizing" });
      const group = await finalizeAttachmentBatch(missionId, batch.uploadBatchId, controller.signal);
      dispatch({ type: "completed", group });
      onGroupCompleted(group);
    } catch (error) {
      if (!controller.signal.aborted) dispatch({ type: "error", message: errorMessage(error) });
    }
  }

  function retryFailed() {
    const failed = state.items.filter((item) => item.status === "error");
    if (!failed.length) return;
    void executeUpload(state.items, state.groupKey, state.sourceRevision, new Set(state.items.filter((item) => item.status === "uploaded").map((item) => item.key)));
  }

  function triggerReplacement(resource: TlozResource & { groupKey: string; externalKey: string; url: string }) {
    setReplaceResource(resource);
    replaceInputRef.current?.click();
  }

  function replaceFile(file: File | undefined) {
    const target = replaceResource;
    setReplaceResource(null);
    if (!file || !target) return;
    void (async () => {
      try {
        const groupResources = resources.filter((resource) => resource.groupKey === target.groupKey && isAttachmentResource(resource));
        const items = await Promise.all(groupResources.map(async (resource) => {
          if (resource.externalKey === target.externalKey) return toAttachmentItem(file, resource.externalKey, resource.title);
          const existing = await fetchExistingAttachment(resource);
          return toAttachmentItem(existing, resource.externalKey, resource.title);
        }));
        validateAttachmentCount(items);
        const revision = createAttachmentRevision();
        dispatch({ type: "select", groupKey: target.groupKey, sourceRevision: revision, items });
        await executeUpload(items, target.groupKey, revision, new Set());
      } catch (error) {
        dispatch({ type: "error", message: errorMessage(error) });
      } finally {
        if (replaceInputRef.current) replaceInputRef.current.value = "";
      }
    })();
  }

  if (!canUpdate && !groups.length) return null;
  return <section className="col-span-full flex min-w-0 flex-col gap-2.5" aria-labelledby="mission-attachments-title">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 id="mission-attachments-title" className="m-0 text-[13px] font-bold uppercase tracking-[0.04em] text-carbon/75">Capturas</h2>
      {canUpdate ? <>
        <label htmlFor="mission-attachment-input" className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#1D1D1B]/15 bg-white px-3 text-[13px] font-semibold text-[#6B6B6B] transition-colors hover:border-[#D72228]/30 hover:text-[#D72228] focus-within:outline focus-within:outline-2 focus-within:outline-[#1D1D1B]/20"><Upload className="size-3.5" aria-hidden="true" />Seleccionar capturas</label>
        <input ref={inputRef} id="mission-attachment-input" type="file" className="sr-only" multiple accept="image/png,image/jpeg,image/webp" onChange={(event) => selectFiles(event.target.files)} aria-describedby="mission-attachment-help" />
        <input ref={replaceInputRef} type="file" className="sr-only" accept="image/png,image/jpeg,image/webp" onChange={(event) => replaceFile(event.target.files?.[0])} aria-label="Seleccionar reemplazo de captura" />
      </> : null}
    </div>
    <p id="mission-attachment-help" className="m-0 text-xs text-carbon/50">PNG, JPEG o WebP · máximo 6 MB por captura · hasta 20 archivos.</p>
    <div className="sr-only" aria-live="polite">{announcement}</div>
    {selectionError ? <p className="m-0 rounded-lg border border-[#B91C22]/20 bg-[#FDECEC] px-3 py-2 text-xs font-semibold text-[#B91C22]" role="alert">{selectionError}</p> : null}
    {state.items.length ? <div className="rounded-xl border border-carbon/10 bg-white p-2.5"><ul className="m-0 flex list-none flex-col gap-1.5 p-0" aria-label="Capturas seleccionadas">{state.items.map((item) => <li key={item.key} className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-carbon/5 px-2.5 py-2"><FileImage className="size-4 shrink-0 text-[#3A47B5]" aria-hidden="true" /><span className="min-w-0 flex-1 truncate text-xs font-semibold">{item.fileName}</span><span className="shrink-0 text-[11px] text-carbon/50">{formatAttachmentSize(item.sizeBytes)}</span><span className="shrink-0 text-[11px] font-semibold text-carbon/60">{item.status === "uploading" ? "Subiendo" : item.status === "uploaded" ? "Completada" : item.status === "error" ? "Error" : "Pendiente"}</span>{item.error ? <span id={`attachment-error-${item.key}`} className="basis-full text-xs font-semibold text-[#B91C22]" role="alert">{item.error}</span> : null}</li>)}</ul><div className="mt-2 flex flex-wrap justify-end gap-1.5">{state.status === "error" && state.items.some((item) => item.status === "error") ? <Button type="button" size="sm" variant="outline" className="min-h-12" onClick={retryFailed}><RefreshCw className="size-3.5" aria-hidden="true" />Reintentar fallos</Button> : null}<Button type="button" size="sm" variant="ghost" className="min-h-12" onClick={() => { abortRef.current?.abort(); dispatch({ type: "reset" }); }}>Cancelar</Button></div></div> : null}
    {groups.map(({ groupKey, items }) => <AttachmentGroupRow key={groupKey} groupKey={groupKey} resources={items} canUpdate={canUpdate} onReplace={triggerReplacement} />)}
  </section>;
}

function useStateReducer() {
  const [state, dispatch] = useReducer(attachmentStateReducer, emptyAttachmentState);
  return [state, dispatch] as const;
}

function AttachmentGroupRow({ groupKey, resources, canUpdate, onReplace }: { groupKey: string; resources: Array<TlozResource & { groupKey: string; externalKey: string; url: string }>; canUpdate: boolean; onReplace: (resource: TlozResource & { groupKey: string; externalKey: string; url: string }) => void }) {
  const previewSlides: ResourcePreviewSlide[] = resources.map((resource) => ({ id: resource.id, src: resource.url, alt: resource.title, title: resource.title }));
  return <div className="rounded-xl border border-carbon/10 bg-white p-2.5"><div className="mb-2 flex min-w-0 flex-wrap items-center gap-2"><span className="text-xs font-bold">Grupo de capturas</span><span className="truncate font-mono text-[11px] text-carbon/50">{groupKey} · rev {resources[0]?.sourceRevision?.slice(0, 7) ?? "—"}</span></div><ul className="m-0 flex list-none flex-col gap-1.5 p-0" aria-label={`Capturas del grupo ${groupKey}`}>{resources.map((resource) => <AttachmentResourceRow key={resource.id} resource={resource} previewSlides={previewSlides} canUpdate={canUpdate} onReplace={() => onReplace(resource)} />)}</ul></div>;
}

function AttachmentResourceRow({ resource, previewSlides, canUpdate, onReplace }: { resource: TlozResource & { url: string }; previewSlides: ResourcePreviewSlide[]; canUpdate: boolean; onReplace: () => void }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return <li className="flex min-w-0 items-center gap-2 rounded-lg border border-carbon/5 px-2.5 py-2"><button ref={triggerRef} type="button" className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-carbon/30" onClick={() => setOpen(true)} aria-label={`Previsualizar ${resource.title}`}><img src={resource.url} alt="" className="size-9 shrink-0 rounded object-cover" /><span className="min-w-0 flex-1 truncate text-xs font-semibold">{resource.title}</span></button><span className="shrink-0 text-[11px] text-carbon/50">{formatAttachmentSize(resource.sizeBytes ?? 0)}</span>{canUpdate ? <Button type="button" size="sm" variant="ghost" className="min-h-12 shrink-0" onClick={onReplace}><RefreshCw className="size-3.5" aria-hidden="true" />Reemplazar</Button> : null}<ResourcePreview slides={previewSlides} open={open} onClose={() => setOpen(false)} index={Math.max(previewSlides.findIndex((slide) => slide.id === resource.id), 0)} triggerRef={triggerRef} /></li>;
}
