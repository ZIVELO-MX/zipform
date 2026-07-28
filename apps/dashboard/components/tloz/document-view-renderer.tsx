"use client";

import type {
  TlozDocument,
  TlozDocumentDefinition,
  TlozDocumentPresentationField,
  TlozDocumentScalar,
  UserProfile,
} from "@tloz/types";
import { Button, SlideOver, toast } from "@tloz/ui";
import { ArrowUpRight, List, Table } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { updateDocumentBody } from "../../app/tloz/actions";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { inventoryItemHref } from "../../lib/tloz-routes";
import { EntityList, EntityTable, type EntityColumn } from "./entity-views";
import { documentValue, resolveVisibleDocumentFields } from "./document-view-model";
import { MarkdownEditor } from "./markdown-editor";
import { ProjectContractEditor } from "./project-contract-editor";
import { resolveMissionIcon } from "./tloz-utils";
import { useTlozViewState } from "./tloz-view-state";

type DocumentViewRendererProps = {
  documents: TlozDocument[];
  definition: TlozDocumentDefinition;
  users: UserProfile[];
};

export function DocumentViewRenderer({
  documents,
  definition,
  users,
}: DocumentViewRendererProps) {
  const { state, setState } = useTlozViewState();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [selected, setSelected] = useState<TlozDocument | null>(null);
  const view = definition.views.find((candidate) => candidate.id === state.view)
    ?? definition.views.find((candidate) => candidate.id === definition.defaultView)
    ?? definition.views[0];
  const fieldsByKey = useMemo(
    () => new Map(definition.fields.map((field) => [field.key, field])),
    [definition.fields],
  );
  const visibleFields = resolveVisibleDocumentFields(
    documents,
    view?.fields ?? [],
    fieldsByKey,
  );
  const usersById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );
  const columns: EntityColumn<TlozDocument>[] = visibleFields.map((field) => ({
    id: field.key,
    label: field.label,
    align: field.format === "date" || field.format === "number" ? "right" : "left",
    render: (document) => field.key === "title"
      ? <DocumentName document={document} />
      : <DocumentValue document={document} field={field} usersById={usersById} />,
  }));

  function openDocument(document: TlozDocument) {
    const href = documentHref(document);
    if (isMobile) router.push(href);
    else setSelected(document);
  }

  const secondaryField = visibleFields.find((field) => field.key !== "title");
  return (
    <>
      <div className="tloz-scrl flex-1 overflow-auto px-0 pb-[26px] md:px-[26px]">
        <DocumentCollectionToolbar
          kind={definition.kind}
          count={documents.length}
          activeView={state.view === "table" ? "table" : "list"}
          onViewChange={(view) => setState({ view })}
        />
        {state.view === "list" ? (
          <EntityList
            title={definition.key === "projects" ? "Projects" : "Inventory"}
            tone={definition.kind === "project" ? "#3A47B5" : "#7A5A12"}
            items={documents}
            onSelect={openDocument}
            render={(document) => (
              <>
                <DocumentName document={document} />
                {secondaryField ? (
                  <span className="ml-auto">
                    <DocumentValue
                      document={document}
                      field={secondaryField}
                      usersById={usersById}
                    />
                  </span>
                ) : null}
              </>
            )}
          />
        ) : (
          <EntityTable
            items={documents}
            columns={columns}
            onSelect={openDocument}
          />
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
          <DocumentDetailView
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

function DocumentCollectionToolbar({
  kind,
  count,
  activeView,
  onViewChange,
}: {
  kind: TlozDocumentDefinition["kind"];
  count: number;
  activeView: "list" | "table";
  onViewChange: (view: "list" | "table") => void;
}) {
  const label = kind === "project" ? "Todos los proyectos" : "Todo el inventario";
  return (
    <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-1 md:px-0">
      <span className="text-xs font-semibold text-carbon/60">
        {label} <span className="font-mono text-[11px] text-carbon/40">({count})</span>
      </span>
      <div className="inline-flex rounded-lg border border-carbon/10 bg-white p-0.5" aria-label="Cambiar vista">
        {(["list", "table"] as const).map((view) => {
          const Icon = view === "list" ? List : Table;
          return (
            <button
              key={view}
              type="button"
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${activeView === view ? "bg-carbon/10 text-carbon" : "text-carbon/50 hover:bg-carbon/5"}`}
              aria-pressed={activeView === view}
              onClick={() => onViewChange(view)}
            >
              <Icon size={13} aria-hidden="true" />
              {view === "list" ? "Lista" : "Tabla"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DocumentEntityView({
  document: initialDocument,
  definition,
  users,
}: {
  document: TlozDocument;
  definition: TlozDocumentDefinition;
  users: UserProfile[];
}) {
  const [document, setDocument] = useState(initialDocument);
  return (
    <>
      <DocumentDetailView
        document={document}
        definition={definition}
        users={users}
        onChange={setDocument}
      />
      {document.kind === "project" ? (
        <ProjectContractEditor document={document} onChange={setDocument} />
      ) : null}
    </>
  );
}

export function DocumentDetailView({
  document: initialDocument,
  definition,
  users,
  panel = false,
  onChange,
}: {
  document: TlozDocument;
  definition: TlozDocumentDefinition;
  users: UserProfile[];
  panel?: boolean;
  onChange?: (document: TlozDocument) => void;
}) {
  const [document, setDocument] = useState(initialDocument);
  const [pending, startTransition] = useTransition();
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

  return (
    <article className={panel ? "min-h-full bg-[#FAFAF9] px-5 py-6" : "mx-auto w-full max-w-[1052px] px-[26px] py-8"}>
      <header className="mb-7 border-b border-carbon/[0.08] pb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-semibold text-carbon/45">
            {document.publicId}
          </span>
          <span className="rounded-full bg-carbon/[0.06] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] text-carbon/55">
            {document.kind}
          </span>
        </div>
        <h1 className="m-0 text-[30px] font-bold tracking-[-0.03em] text-carbon">
          {document.title}
        </h1>
        {document.summary ? (
          <p className="mt-2 max-w-3xl text-[14px] font-medium leading-6 text-carbon/55">
            {document.summary}
          </p>
        ) : null}
        {panel || (document.kind === "project" && document.projectSlug) ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {panel ? (
              <Button asChild variant="outline" size="sm">
                <Link href={documentHref(document)}>
                  Abrir detalle
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </Button>
            ) : null}
            {document.kind === "project" && document.projectSlug ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/${document.projectSlug}`}>
                  Abrir workspace
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className={panel ? "grid gap-7" : "grid gap-8 lg:grid-cols-[minmax(0,1fr)_308px]"}>
        <div className="min-w-0">
          <MarkdownEditor
            value={document.body}
            onSave={saveBody}
            placeholder="Sin detalle."
          />
          {pending ? (
            <p className="text-[11px] font-semibold text-carbon/40" role="status">
              Guardando…
            </p>
          ) : null}
        </div>
        <aside>
          <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.04em] text-carbon/70">
            Propiedades
          </h2>
          <dl className="overflow-hidden rounded-xl border border-carbon/[0.09] bg-white">
            {fields.map((field) => (
              <div
                key={field.key}
                className="grid grid-cols-[108px_minmax(0,1fr)] gap-3 border-b border-carbon/[0.06] px-3 py-2.5 last:border-b-0"
              >
                <dt className="text-[11px] font-semibold text-carbon/45">{field.label}</dt>
                <dd className="min-w-0 text-right text-[12px] font-semibold text-carbon">
                  <DocumentValue document={document} field={field} usersById={usersById} />
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </article>
  );
}

function DocumentName({ document }: { document: TlozDocument }) {
  const Icon = resolveMissionIcon(
    typeof document.properties.icon === "string"
      ? document.properties.icon
      : document.kind === "inventory"
        ? "PackageOpen"
        : "FolderKanban",
  );
  const tone = typeof document.properties.color === "string"
    ? document.properties.color
    : document.kind === "inventory"
      ? "#7A5A12"
      : "#3A47B5";
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2.5 font-semibold text-carbon">
      <span
        className="grid size-7 shrink-0 place-items-center rounded-lg [&_svg]:size-3.5"
        style={{ background: `${tone}18`, color: tone }}
      >
        <Icon aria-hidden="true" />
      </span>
      <span className="truncate">{document.title}</span>
    </span>
  );
}

function DocumentValue({
  document,
  field,
  usersById,
}: {
  document: TlozDocument;
  field: TlozDocumentPresentationField;
  usersById: Map<string, UserProfile>;
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
