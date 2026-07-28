"use client";

import type {
  TlozDocument,
  TlozDocumentDefinition,
  TlozDocumentPresentationField,
  TlozDocumentScalar,
  UserProfile,
} from "@tloz/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, Input, SlideOver, toast } from "@tloz/ui";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  getMissionCapabilities,
  getMissionDetail,
  getMissionDetailOptions,
  getMissionDocumentOptions,
  updateDocumentBody,
  updateDocumentContent,
} from "../../app/tloz/actions";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { inventoryItemHref } from "../../lib/tloz-routes";
import { documentValue, documentToMissionView } from "./document-view-model";
import { MarkdownEditor } from "./markdown-editor";
import { ProjectContractEditor } from "./project-contract-editor";
import { resolveMissionIcon } from "./tloz-utils";
import { useTlozViewState } from "./tloz-view-state";
import type { TlozMissionDetail } from "../../lib/tloz-data";
import { MissionDetail, type MissionDetailOptions } from "./mission-detail";
import type { TlozMissionRecord } from "../../lib/tloz-data";
import { MissionList, MissionTable, type MissionViewRecord } from "./mission-views";

type DocumentViewRendererProps = {
  documents: TlozDocument[];
  definition: TlozDocumentDefinition;
  users: UserProfile[];
  fallback?: React.ReactNode;
  missionRecords?: TlozMissionRecord[];
};

type DocumentUser = Pick<UserProfile, "id" | "name">;

export function DocumentViewRenderer({
  documents,
  definition,
  users,
  fallback,
  missionRecords,
}: DocumentViewRendererProps) {
  const { state } = useTlozViewState();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [selected, setSelected] = useState<TlozDocument | null>(null);
  const displayRecords = useMemo<MissionViewRecord[]>(
    () => missionRecords ?? documents.map((document) => documentToMissionView(document, users)),
    [documents, missionRecords, users],
  );
  const statusOptions = definition.fields.find((field) => field.key === "status")?.options ?? [];

  function openDocument(document: TlozDocument) {
    const href = documentHref(document);
    if (isMobile) router.push(href);
    else setSelected(document);
  }

  function openRecord(record: MissionViewRecord) {
    const document = documents.find((candidate) => (
      candidate.id === record.id || candidate.source?.id === record.id
    ));
    if (document) openDocument(document);
  }

  if (state.view !== "list" && state.view !== "table" && fallback) return fallback;

  return (
    <>
      <div className="tloz-scrl flex-1 overflow-auto px-0 pb-[26px] md:px-[26px]">
        {state.view === "list" ? (
          <MissionList missions={displayRecords} grouping={state.grouping} statusOptions={statusOptions} onSelect={openRecord} />
        ) : (
          <MissionTable missions={displayRecords} statusOptions={statusOptions} onSelect={openRecord} />
        )}
      </div>
      <SlideOver
        open={Boolean(selected)}
        title={selected?.title ?? "Detalle"}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        {selected ? (
          <DocumentDetail
            key={selected.id}
            document={selected}
            definition={definition}
            users={users}
            panel
            onChange={setSelected}
          />
        ) : null}
      </SlideOver>
    </>
  );
}

export function DocumentEntityView({
  document: initialDocument,
  definition,
  users,
}: {
  document: TlozDocument;
  definition: TlozDocumentDefinition;
  users: DocumentUser[];
}) {
  const [document, setDocument] = useState(initialDocument);
  return <DocumentDetail document={document} definition={definition} users={users} onChange={setDocument} />;
}

type DocumentDetailProps = {
  document: TlozDocument;
  definition: TlozDocumentDefinition;
  users: DocumentUser[];
  panel?: boolean;
  onChange?: (document: TlozDocument) => void;
} | {
  mission: TlozMissionDetail;
  options: MissionDetailOptions;
  canUpdate?: boolean;
  panel?: boolean;
  onMissionChange?: (mission: TlozMissionDetail) => void;
  onNavigateMission?: (missionId: string) => void;
  onNavigateQuestItem?: (questItemId: string) => void;
};

export function DocumentDetail(props: DocumentDetailProps) {
  if ("mission" in props) {
    return (
      <MissionDetail
        mission={props.mission}
        options={props.options}
        canUpdate={props.canUpdate}
        variant={props.panel ? "panel" : "full"}
        onMissionChange={props.onMissionChange}
        onNavigateMission={props.onNavigateMission}
        onNavigateQuestItem={props.onNavigateQuestItem}
      />
    );
  }
  if (props.document.kind === "mission") {
    return <MissionDocumentDetail document={props.document} panel={props.panel} />;
  }
  return <DocumentRecordDetail {...props} />;
}

function MissionDocumentDetail({ document, panel = false }: { document: TlozDocument; panel?: boolean }) {
  const [result, setResult] = useState<{
    mission: TlozMissionDetail;
    options: MissionDetailOptions;
    canUpdate: boolean;
  } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const missionId = document.source?.id ?? document.publicId;
    setResult(null);
    setError(false);
    void Promise.all([
      getMissionDetail(missionId),
      getMissionDetailOptions(),
      getMissionDocumentOptions(missionId),
      getMissionCapabilities(missionId),
    ]).then(([mission, options, documentOptions, capabilities]) => {
      if (!active || !mission) {
        if (active) setError(true);
        return;
      }
      setResult({
        mission,
        options: {
          ...options,
          document: documentOptions.document ?? undefined,
          contract: documentOptions.contract,
        },
        canUpdate: capabilities.canUpdate,
      });
    }).catch(() => {
      if (active) setError(true);
    });
    return () => {
      active = false;
    };
  }, [document.publicId, document.source?.id]);

  if (error) return <div className="p-6 text-sm font-semibold text-[#B91C22]" role="alert">No se pudo cargar la Mission.</div>;
  if (!result) return <div className="flex min-h-40 items-center justify-center gap-2 p-6 text-sm text-carbon/50" role="status" aria-live="polite"><span className="size-4 animate-spin rounded-full border-2 border-carbon/20 border-t-carbon/70" aria-hidden="true" />Cargando Mission…</div>;
  return <MissionDetail mission={result.mission} options={result.options} canUpdate={result.canUpdate} variant={panel ? "panel" : "full"} />;
}

function DocumentRecordDetail({
  document: initialDocument,
  definition,
  users,
  panel = false,
  onChange,
}: Extract<DocumentDetailProps, { document: TlozDocument }>) {
  const [document, setDocument] = useState(initialDocument);
  const [pending, startTransition] = useTransition();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(initialDocument.title);
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState(initialDocument.summary);
  const detail = definition.views.find((view) => view.id === "detail");
  const fieldsByKey = useMemo(
    () => new Map(definition.fields.map((field) => [field.key, field])),
    [definition.fields],
  );
  const usersById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );
  const fields = (detail?.fields ?? [])
    .map((key) => fieldsByKey.get(key) ?? fallbackField(key))
    .filter((field) => field.visible)
    .filter((field) => documentValue(document, field.key) !== null);
  const Icon = resolveMissionIcon(
    typeof document.properties.icon === "string"
      ? document.properties.icon
      : document.kind === "project"
        ? "FolderKanban"
        : document.kind === "mission"
          ? "Sword"
          : "PackageOpen",
  );
  const tone = typeof document.properties.color === "string"
    ? document.properties.color
    : document.kind === "project"
      ? "#3A47B5"
      : document.kind === "mission"
        ? "#D72228"
        : "#7A5A12";
  const statusField = fields.find((field) => field.key === "status");

  function saveBody(body: string) {
    const toastId = toast.loading("Guardando documento…");
    startTransition(async () => {
      try {
        const updated = await updateDocumentBody(document.id, body, document.revision);
        setDocument(updated);
        onChange?.(updated);
        toast.success("Documento actualizado", { id: toastId });
      } catch {
        toast.error("No se pudo guardar el documento", { id: toastId });
      }
    });
  }

  function saveContent(input: { title?: string; summary?: string }) {
    const toastId = toast.loading("Guardando documento…");
    startTransition(async () => {
      try {
        const updated = await updateDocumentContent(document.id, input, document.revision);
        setDocument(updated);
        setTitleDraft(updated.title);
        setSummaryDraft(updated.summary);
        onChange?.(updated);
        toast.success("Documento actualizado", { id: toastId });
      } catch {
        setTitleDraft(document.title);
        setSummaryDraft(document.summary);
        toast.error("No se pudo guardar el documento", { id: toastId });
      }
    });
  }

  function finishTitle() {
    const title = titleDraft.trim();
    setEditingTitle(false);
    if (!title || title === document.title) {
      setTitleDraft(document.title);
      return;
    }
    saveContent({ title });
  }

  function finishSummary() {
    const summary = summaryDraft.trim();
    setEditingSummary(false);
    if (summary === document.summary) return;
    saveContent({ summary });
  }

  return (
    <article className={`mission-detail-workspace mx-auto w-full max-w-[1052px] px-4 py-5 md:px-[26px] md:py-7 ${panel ? "min-h-full bg-[#FAFAF9]" : ""}`} aria-busy={pending}>
      <div className="mission-detail-layout grid min-w-0 gap-[30px]">
        <main className="min-w-0">
          <header>
            <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] text-[11.5px] font-bold" style={{ backgroundColor: `${tone}18`, color: tone }}>
                <Icon className="size-[13px]" aria-hidden="true" />
                {document.kind === "project" ? "Project" : document.kind === "mission" ? "Mission" : "Inventory"}
              </span>
              {statusField ? <DocumentValue document={document} field={statusField} usersById={usersById} /> : null}
              <span className="ml-0.5 font-mono text-[11.5px] text-[#9A9A98]">{document.publicId}</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg [&_svg]:size-[15px]" style={{ backgroundColor: `${tone}18`, color: tone }}><Icon aria-hidden="true" /></span>
              {editingTitle ? (
                <Input autoFocus className="h-auto border border-[#1D1D1B]/15 bg-white px-2 py-0 text-[30px] font-bold leading-[1.12] tracking-[-0.025em] shadow-none" value={titleDraft} aria-label="Título del documento" onChange={(event) => setTitleDraft(event.target.value)} onBlur={finishTitle} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") { setTitleDraft(document.title); setEditingTitle(false); } }} />
              ) : (
                <button type="button" className="max-w-full rounded-md text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1D1D1B]/20" onClick={() => setEditingTitle(true)}><h1 className="m-0 text-balance text-[30px] font-bold leading-[1.12] tracking-[-0.025em] text-[#1D1D1B]">{document.title}</h1></button>
              )}
            </div>
          </header>

          <Accordion type="multiple" defaultValue={["description", "detail"]} className="mb-7 mt-3" aria-label="Contenido del documento">
            <AccordionItem value="description" className="border-0">
              <AccordionTrigger iconPosition="start" className="py-2 text-[13px] uppercase tracking-[0.04em] text-carbon/75">Descripción</AccordionTrigger>
              <AccordionContent className="pt-1">
                {editingSummary ? (
                  <textarea autoFocus className="min-h-28 w-full resize-y rounded-xl border border-[#1D1D1B]/15 bg-white px-3 py-2 text-[15px] leading-[1.6] text-[#454543] outline-none focus:border-[#1D1D1B]/25 focus:ring-2 focus:ring-[#1D1D1B]/10" value={summaryDraft} aria-label="Descripción del documento" maxLength={280} onChange={(event) => setSummaryDraft(event.target.value)} onBlur={finishSummary} onKeyDown={(event) => { if (event.key === "Escape") { setSummaryDraft(document.summary); setEditingSummary(false); } }} />
                ) : (
                  <button type="button" className="block max-w-[62ch] rounded-md text-left text-[15px] leading-[1.6] text-[#454543] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1D1D1B]/20" onClick={() => setEditingSummary(true)}>{document.summary || "Añadir descripción"}</button>
                )}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="detail" className="border-0">
              <AccordionTrigger iconPosition="start" className="py-2 text-[13px] uppercase tracking-[0.04em] text-carbon/75">Detalle</AccordionTrigger>
              <AccordionContent className="pt-1">
                <MarkdownEditor value={document.body} onSave={saveBody} placeholder="Sin detalle." showHeader={false} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          {document.kind === "project" ? <ProjectContractEditor document={document} embedded onChange={(updated) => { setDocument(updated); onChange?.(updated); }} /> : null}
          {pending ? <p className="text-[11px] font-semibold text-carbon/40" role="status">Guardando…</p> : null}
        </main>

        <aside className="mission-detail-properties flex self-start flex-col gap-3.5" aria-label="Información del documento">
          {panel ? (
            <Link href={documentHref(document)} className="flex items-center justify-center gap-2 rounded-xl border border-carbon/10 bg-white px-4 py-3 text-[13px] font-semibold text-carbon/60 no-underline transition-colors hover:border-carbon/20 hover:text-carbon">
              Abrir en página completa <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          ) : null}
          {document.kind === "project" && document.projectSlug ? (
            <Button asChild variant="outline" className="min-h-11 rounded-xl"><Link href={`/${document.projectSlug}`}>Abrir workspace<ArrowUpRight aria-hidden="true" /></Link></Button>
          ) : null}
          <section className="overflow-hidden rounded-2xl border border-[#1D1D1B]/10 bg-white" aria-labelledby={`document-properties-${document.id}`}>
            <h2 id={`document-properties-${document.id}`} className="m-0 border-b border-[#1D1D1B]/[0.07] px-4 py-[13px] text-[11px] font-bold uppercase tracking-[0.05em] text-[#9A9A98]">Propiedades</h2>
            <dl className="px-2 py-1.5">
            {fields.map((field) => (
              <div
                key={field.key}
                className="grid grid-cols-[108px_minmax(0,1fr)] gap-3 border-b border-carbon/[0.06] px-2 py-2.5 last:border-b-0"
              >
                <dt className="text-[11px] font-semibold text-carbon/45">{field.label}</dt>
                <dd className="min-w-0 text-right text-[12px] font-semibold text-carbon">
                  <DocumentValue document={document} field={field} usersById={usersById} />
                </dd>
              </div>
            ))}
            </dl>
          </section>
          <section className="overflow-hidden rounded-2xl border border-[#1D1D1B]/10 bg-white" aria-labelledby={`document-activity-${document.id}`}>
            <h2 id={`document-activity-${document.id}`} className="m-0 border-b border-[#1D1D1B]/[0.07] px-4 py-[13px] text-[11px] font-bold uppercase tracking-[0.05em] text-[#9A9A98]">Actividad</h2>
            <div className="flex flex-col gap-3 p-4 text-xs text-[#6B6B6B]">
              <span>Documento actualizado · {new Date(document.updatedAt).toLocaleDateString("es-MX")}</span>
              <span>Documento creado · {new Date(document.createdAt).toLocaleDateString("es-MX")}</span>
            </div>
          </section>
        </aside>
      </div>
    </article>
  );
}


function DocumentValue({
  document,
  field,
  usersById,
}: {
  document: TlozDocument;
  field: TlozDocumentPresentationField;
  usersById: Map<string, DocumentUser>;
}) {
  const value = documentValue(document, field.key);
  if (value === null) return null;
  if (field.format === "status" && typeof value === "string") {
    const option = field.options?.find((candidate) => candidate.value === value);
    const tone = option?.color ?? statusTone(option?.role, value);
    return (
      <span
        className="inline-block rounded-full px-[9px] py-[3px] text-[11px] font-bold"
        style={{ background: `${tone}18`, color: tone }}
      >
        {option?.label ?? humanize(value)}
      </span>
    );
  }
  if (field.format === "person" && typeof value === "string") {
    return <span>{usersById.get(value)?.name ?? value}</span>;
  }
  if (field.format === "date" || field.format === "id" || field.format === "number") {
    return <span className="font-mono text-[11.5px] text-carbon/55">{displayValue(value)}</span>;
  }
  return <span className="text-xs text-carbon/65">{displayValue(value)}</span>;
}

function fallbackField(key: string): TlozDocumentPresentationField {
  const formats: Record<string, TlozDocumentPresentationField["format"]> = {
    publicId: "id",
    status: "status",
    start: "date",
    due: "date",
    acquired: "date",
    progress: "number",
    mission_count: "number",
    owner: "person",
    assignee: "person",
  };
  return {
    key,
    label: humanize(key),
    format: formats[key] ?? "text",
    position: 999,
    visible: true,
  };
}

function documentHref(document: TlozDocument) {
  return document.kind === "project"
    ? `/projects/${encodeURIComponent(document.publicId)}`
    : inventoryItemHref(document.publicId);
}

function displayValue(value: TlozDocumentScalar) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return String(value);
}

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusTone(role: string | undefined, value: string) {
  if (role === "done" || value === "active" || value === "unlocked") return "#1E6B3C";
  if (role === "blocked" || value === "blocked") return "#B91C22";
  if (role === "ready" || value === "planned") return "#3A47B5";
  return "#7A5A12";
}
