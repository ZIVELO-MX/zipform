"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Lightbulb } from "lucide-react";
import { EmptyState, SlideOver, StatusPill, UserAvatarLabel } from "@tloz/ui";
import type { ContainerDefinition, ContainerRecord, ContentRecord, UserProfile } from "@tloz/types";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { EntityList, EntityTable, type EntityColumn } from "./entity-views";
import { TlozViewHeader } from "./tloz-shell";
import { useTlozViewState } from "./tloz-view-state";
import { ContainerContentDetail } from "./container-content-detail";
import { canonicalCollectionFields, contentValue, filterAndSortContents } from "./container-content-view-model";
import { scalarText } from "./container-content-field";
import { formatDate } from "./tloz-utils";

export function ContainerContentCollection({
  container,
  initialContents,
  users,
}: {
  container: ContainerRecord;
  initialContents: ContentRecord[];
  users: UserProfile[];
}) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { state } = useTlozViewState();
  const [contents, setContents] = useState(initialContents);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => setContents(initialContents), [initialContents]);

  const visible = useMemo(
    () => filterAndSortContents(contents, state, container.definition),
    [container.definition, contents, state],
  );
  const selected = selectedId ? contents.find((content) => content.id === selectedId) ?? null : null;
  // Workshop and Library intentionally share the same compact presentation
  // contract used by the other top-level collections.
  const fieldKeys = canonicalCollectionFields(container.presentation);

  function open(content: ContentRecord) {
    if (isMobile) {
      router.push(`/${container.presentation}/${encodeURIComponent(content.publicId)}`);
      return;
    }
    setSelectedId(content.id);
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <TlozViewHeader
          title={state.view === "table" ? "Tabla" : "Lista"}
          description={`${container.title} · ${visible.length} elementos`}
        />
        <div className="tloz-scrl flex-1 overflow-auto px-0 pb-[26px] md:px-[26px]">
          {visible.length === 0 ? (
            <EmptyState title={`Sin elementos en ${container.title}`} description="Crea el primer elemento desde Control." />
          ) : state.view === "table" ? (
            <EntityTable
              items={visible}
              columns={columnsFor(container, fieldKeys, users)}
              onSelect={open}
              minWidth={980}
            />
          ) : (
            <ContentList
              contents={visible}
              definition={container.definition}
              container={container}
              fieldKeys={fieldKeys}
              users={users}
              grouping={state.grouping}
              onSelect={open}
            />
          )}
        </div>
      </div>
      <SlideOver open={Boolean(selected)} title={selected?.title ?? "Detalle"} onOpenChange={(open) => !open && setSelectedId(null)}>
        {selected ? (
          <ContainerContentDetail
            key={`${selected.id}:${selected.revision}`}
            container={container}
            content={selected}
            users={users}
            onChange={(updated) => setContents((current) => current.map((item) => item.id === updated.id ? updated : item))}
          />
        ) : null}
      </SlideOver>
    </>
  );
}

function ContentList({
  contents,
  definition,
  container,
  fieldKeys,
  users,
  grouping,
  onSelect,
}: {
  contents: ContentRecord[];
  definition: ContainerDefinition;
  container: ContainerRecord;
  fieldKeys: string[];
  users: UserProfile[];
  grouping: "status" | "project" | "none";
  onSelect: (content: ContentRecord) => void;
}) {
  const statusField = definition.fields.find((field) => field.key === "status");
  const statuses = statusField?.options ?? [];
  const groups = grouping === "status"
    ? [
      ...statuses.map((option) => ({
        id: option.value,
        label: option.label,
        tone: option.color,
        contents: contents.filter((content) => content.data.status === option.value),
      })),
      ...Array.from(new Set(contents
        .map((content) => scalarText(content.data.status))
        .filter((status) => status && !statuses.some((option) => option.value === status))))
        .map((status) => ({ id: status, label: status, tone: undefined, contents: contents.filter((content) => content.data.status === status) })),
      ...contents.some((content) => !scalarText(content.data.status))
        ? [{ id: "none", label: "Sin estado", tone: undefined, contents: contents.filter((content) => !scalarText(content.data.status)) }]
        : [],
    ]
    : [{ id: "all", label: "Todos", tone: undefined, contents }];

  return <>{groups.filter((group) => group.contents.length > 0).map((group) => (
    <EntityList
      key={group.id}
      title={group.label}
      tone={group.tone}
      items={group.contents}
      onSelect={onSelect}
      render={(content) => (
        <span className="flex min-w-0 flex-1 items-center gap-3">
          {fieldKeys.map((key) => key === "title" ? (
            <strong key={key} className="min-w-0 flex-1 truncate text-[13.5px]">{content.title}</strong>
          ) : (
            <span key={key} className={`${key === "icon" ? "" : "hidden sm:block"} shrink-0 text-xs text-carbon/60`}>
              <ContentFieldValue content={content} fieldKey={key} definition={definition} users={users} container={container} />
            </span>
          ))}
        </span>
      )}
    />
  ))}</>;
}

function columnsFor(container: ContainerRecord, fieldKeys: string[], users: UserProfile[]): EntityColumn<ContentRecord>[] {
  const { definition } = container;
  return fieldKeys.map((key) => ({
    id: key,
    label: key === "icon" ? "" : key === "title" ? "Nombre" : key === "publicId" ? "ID" : key === "project" ? "Project" : key === "ownerId" ? "Responsable" : "Fecha",
    render: (content) => <ContentFieldValue content={content} fieldKey={key} definition={definition} users={users} container={container} />,
  }));
}

function ContentFieldValue({
  content,
  fieldKey,
  definition,
  users,
  container,
}: {
  content: ContentRecord;
  fieldKey: string;
  definition: ContainerDefinition;
  users: UserProfile[];
  container: ContainerRecord;
}) {
  const field = definition.fields.find((candidate) => candidate.key === fieldKey);
  const value = contentValue(content, fieldKey);
  const text = scalarText(value);
  if (fieldKey === "icon") {
    const Icon = container.presentation === "library" ? BookOpen : Lightbulb;
    return <span className="grid size-7 place-items-center rounded-[7px] bg-carbon/5 text-carbon/70 [&_svg]:size-3.5"><Icon aria-hidden="true" /></span>;
  }
  if (fieldKey === "title") return <span className="font-semibold text-carbon">{content.title}</span>;
  if (fieldKey === "publicId") return <span className="font-mono text-[10.5px] text-carbon/45">{content.publicId}</span>;
  if (fieldKey === "project") return <span className="truncate rounded-full bg-carbon/5 px-2 py-0.5 text-[11px] font-semibold text-carbon/70">{container.title}</span>;
  if (field?.format === "status") {
    const option = field.options?.find((candidate) => candidate.value === text);
    return <StatusPill label={option?.label ?? (text || "Sin estado")} color={option?.color ?? "#6B6B6B"} active={option?.role === "active"} />;
  }
  if (field?.format === "person") {
    const user = users.find((candidate) => candidate.id === text);
    return user ? <UserAvatarLabel name={user.name} label={user.name} labelOnly imageUrl={user.avatarUrl} size="sm" /> : <span>Sin responsable</span>;
  }
  if (field?.format === "date" || fieldKey === "dueDate" || fieldKey === "acquiredAt") {
    return <span className="font-mono text-[11.5px] text-carbon/60">{formatDate(text || undefined)}</span>;
  }
  const option = field?.options?.find((candidate) => candidate.value === text);
  return <span>{option?.label ?? (text || "—")}</span>;
}
