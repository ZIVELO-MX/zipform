"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState, SlideOver } from "@tloz/ui";
import type { ContainerRecord, ContentRecord, UserProfile } from "@tloz/types";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { MissionList, MissionTable, type MissionViewRecord } from "./mission-views";
import { TlozViewHeader } from "./tloz-shell";
import { useTlozViewState } from "./tloz-view-state";
import { ContainerContentDetail } from "./container-content-detail";
import { canonicalContentDocument, canonicalContentHref } from "./container-content-view-model";
import { documentToMissionView } from "./document-view-model";
import { filterAndSortTlozRecords } from "./tloz-view-query";
import { CollectionPagination } from "./collection-pagination";

export function ContainerContentCollection({
  container,
  initialContents,
  users,
  currentCursor,
  nextCursor,
  basePath,
}: {
  container: ContainerRecord;
  initialContents: ContentRecord[];
  users: UserProfile[];
  currentCursor?: string;
  nextCursor: string | null;
  basePath: string;
}) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { state } = useTlozViewState();
  const [contents, setContents] = useState(initialContents);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => setContents(initialContents), [initialContents]);

  const statusOptions = container.definition.fields.find((field) => field.key === "status")?.options ?? [];
  const records = useMemo<MissionViewRecord[]>(
    () => contents.map((content) => documentToMissionView(canonicalContentDocument(content, container), users)),
    [container, contents, users],
  );
  const visible = useMemo(
    () => filterAndSortTlozRecords(records, state, statusOptions, { defaultSort: "source" }),
    [records, state, statusOptions],
  );
  const selected = selectedId ? contents.find((content) => content.id === selectedId) ?? null : null;

  function open(record: MissionViewRecord) {
    const content = contents.find((candidate) => candidate.id === record.id);
    if (!content) return;
    if (isMobile) {
      router.push(canonicalContentHref(container.presentation, content.publicId));
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
            <MissionTable missions={visible} statusOptions={statusOptions} onSelect={open} />
          ) : (
            <MissionList missions={visible} grouping={state.grouping} statusOptions={statusOptions} onSelect={open} />
          )}
        </div>
        <CollectionPagination basePath={basePath} currentCursor={currentCursor} nextCursor={nextCursor} />
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
