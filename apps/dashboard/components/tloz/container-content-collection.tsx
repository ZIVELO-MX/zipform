"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState, SlideOver, StatusPill, UserAvatarLabel } from "@tloz/ui";
import type { ContainerDefinition, ContainerRecord, ContentRecord, UserProfile } from "@tloz/types";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { EntityList, EntityTable, type EntityColumn } from "./entity-views";
import { TlozViewHeader } from "./tloz-shell";
import { useTlozViewState } from "./tloz-view-state";
import { ContainerContentDetail } from "./container-content-detail";
import { contentValue, filterAndSortContents } from "./container-content-view-model";
import { scalarText } from "./container-content-field";

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
  const view = container.definition.views.find((candidate) => candidate.id === state.view)
    ?? container.definition.views.find((candidate) => candidate.id === container.definition.defaultView);
  const fieldKeys = view?.fields ?? ["title"];

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
              columns={columnsFor(container.definition, fieldKeys, users)}
              onSelect={open}
              minWidth={Math.max(fieldKeys.length * 170, 620)}
            />
          ) : (
            <ContentList
              contents={visible}
              definition={container.definition}
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
  fieldKeys,
  users,
  grouping,
  onSelect,
}: {
  contents: ContentRecord[];
  definition: ContainerDefinition;
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
          <strong className="min-w-0 flex-1 truncate text-[13.5px]">{content.title}</strong>
          {fieldKeys.filter((key) => key !== "title").map((key) => (
            <span key={key} className="hidden shrink-0 text-xs text-carbon/60 sm:block">
              <ContentFieldValue content={content} fieldKey={key} definition={definition} users={users} />
            </span>
          ))}
        </span>
      )}
    />
  ))}</>;
}

function columnsFor(definition: ContainerDefinition, fieldKeys: string[], users: UserProfile[]): EntityColumn<ContentRecord>[] {
  return fieldKeys.map((key) => ({
    id: key,
    label: key === "title" ? "Título" : key === "publicId" ? "ID" : definition.fields.find((field) => field.key === key)?.label ?? key,
    render: (content) => <ContentFieldValue content={content} fieldKey={key} definition={definition} users={users} />,
  }));
}

function ContentFieldValue({
  content,
  fieldKey,
  definition,
  users,
}: {
  content: ContentRecord;
  fieldKey: string;
  definition: ContainerDefinition;
  users: UserProfile[];
}) {
  const field = definition.fields.find((candidate) => candidate.key === fieldKey);
  const value = contentValue(content, fieldKey);
  const text = scalarText(value);
  if (fieldKey === "title") return <span className="font-semibold text-carbon">{content.title}</span>;
  if (fieldKey === "publicId") return <span className="font-mono text-[10.5px] text-carbon/45">{content.publicId}</span>;
  if (field?.format === "status") {
    const option = field.options?.find((candidate) => candidate.value === text);
    return <StatusPill label={option?.label ?? (text || "Sin estado")} color={option?.color ?? "#6B6B6B"} active={option?.role === "active"} />;
  }
  if (field?.format === "person") {
    const user = users.find((candidate) => candidate.id === text);
    return user ? <UserAvatarLabel name={user.name} label={user.name} labelOnly imageUrl={user.avatarUrl} size="sm" /> : <span>Sin responsable</span>;
  }
  const option = field?.options?.find((candidate) => candidate.value === text);
  return <span>{option?.label ?? (text || "—")}</span>;
}
