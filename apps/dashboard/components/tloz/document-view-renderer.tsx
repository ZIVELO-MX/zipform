"use client";

import type {
  TlozDocument,
  TlozDocumentDefinition,
  TlozDocumentUpdate,
  TlozProject,
  UserProfile,
} from "@tloz/types";
import { parseMarkdownChecklist } from "@tloz/data";
import { SlideOver } from "@tloz/ui";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getMissionCapabilities,
  getDocumentDetailOptions,
  getMissionDetail,
  getMissionDetailOptions,
  getMissionDocumentOptions,
  getEntityResources,
  addProjectResource,
  removeProjectResource,
  addQuestItemResource,
  removeQuestItemResource,
  updateDocument,
} from "../../app/tloz/actions";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { inventoryItemHref } from "../../lib/tloz-routes";
import {
  documentValue,
  documentToMissionView,
  resolveDocumentDetailPropertyProjection,
} from "./document-view-model";
import { useTlozViewState } from "./tloz-view-state";
import type { TlozMissionDetail } from "../../lib/tloz-data";
import { MissionDetail, type MissionDetailOptions } from "./mission-detail";
import type { TlozMissionRecord } from "../../lib/tloz-data";
import { MissionList, MissionTable, type MissionViewRecord } from "./mission-views";
import { TlozViewHeader } from "./tloz-shell";

const collectionViewConfig = {
  list: { title: "Lista", description: "Todas las missions · agrupadas por estado" },
  table: { title: "Tabla", description: "Todas las missions · todas las propiedades" },
} as const;

type DocumentViewRendererProps = {
  documents: TlozDocument[];
  definition: TlozDocumentDefinition;
  users: UserProfile[];
  fallback?: React.ReactNode;
  missionRecords?: TlozMissionRecord[];
};

type DocumentUser = Pick<UserProfile, "id" | "name">;
type DocumentResource = import("@tloz/types").TlozResource;

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
  const collectionView = state.view === "table" ? "table" : "list";

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <TlozViewHeader
          title={collectionViewConfig[collectionView].title}
          description={collectionViewConfig[collectionView].description}
        />
        <div className="tloz-scrl flex-1 overflow-auto px-0 pb-[26px] md:px-[26px]">
          {state.view === "list" ? (
            <MissionList missions={displayRecords} grouping={state.grouping} statusOptions={statusOptions} onSelect={openRecord} />
          ) : (
            <MissionTable missions={displayRecords} statusOptions={statusOptions} onSelect={openRecord} />
          )}
        </div>
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
  canMove?: boolean;
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
        canMove={props.canMove}
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
    canMove: boolean;
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
        canMove: capabilities.canMove,
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
  return <MissionDetail mission={result.mission} options={result.options} canUpdate={result.canUpdate} canMove={result.canMove} variant={panel ? "panel" : "full"} />;
}

function DocumentRecordDetail(props: Extract<DocumentDetailProps, { document: TlozDocument }>) {
  const [detail, setDetail] = useState<{
    document: TlozDocument;
    contract: NonNullable<MissionDetailOptions["contract"]>;
    canUpdate: boolean;
    canMove: boolean;
    resources: DocumentResource[];
  }>({
    document: props.document,
    contract: [],
    canUpdate: false,
    canMove: false,
    resources: [],
  });

  useEffect(() => {
    let active = true;
    setDetail((current) => ({ ...current, document: props.document }));
    const entityId = props.document.source?.id ?? props.document.id;
    void Promise.all([
      getDocumentDetailOptions(props.document.id),
      getEntityResources(documentResourceKind(props.document.kind), entityId).catch(() => []),
    ]).then(([result, resources]) => {
      if (!active) return;
      setDetail({
        document: result.document,
        contract: result.contract,
        canUpdate: result.capabilities.canUpdate,
        canMove: result.capabilities.canMove,
        resources,
      });
      props.onChange?.(result.document);
    }).catch(() => {
      if (active) setDetail((current) => ({
        ...current,
        canUpdate: false,
        canMove: false,
      }));
    });
    return () => {
      active = false;
    };
  }, [props.document.id]);

  const mission = documentToDetailMission(detail.document, props.users, detail.resources);
  const detailProperties = resolveDocumentDetailPropertyProjection(
    detail.document,
    props.definition,
  );

  function acceptDocument(document: TlozDocument) {
    setDetail((current) => ({ ...current, document }));
    props.onChange?.(document);
    return documentToDetailMission(document, props.users, detail.resources);
  }

  async function mutate(input: TlozDocumentUpdate) {
    try {
      const updated = await updateDocument(
        detail.document.id,
        input,
        detail.document.revision,
      );
      return acceptDocument(updated);
    } catch (error) {
      const refreshed = await Promise.all([
        getDocumentDetailOptions(detail.document.id),
        getEntityResources(documentResourceKind(detail.document.kind), detail.document.source?.id ?? detail.document.id).catch(() => []),
      ]).catch(() => null);
      if (refreshed) {
        const [result, resources] = refreshed;
        setDetail({
          document: result.document,
          contract: result.contract,
          canUpdate: result.capabilities.canUpdate,
          canMove: result.capabilities.canMove,
          resources,
        });
        props.onChange?.(result.document);
      }
      throw error;
    }
  }

  return (
    <MissionDetail
      mission={mission}
      options={{
        projects: mission.project ? [mission.project] : [],
        users: props.users,
        missions: [],
        questItems: [],
        document: detail.document,
        contract: detail.contract,
        presentationFields: props.definition.fields,
        detailProperties,
        hideEmptyFields: true,
      }}
      canUpdate={false}
      canMove={detail.canMove}
      canUpdateDocument={detail.canUpdate}
      documentMutation={mutate}
      onAddResource={(input) => detail.document.kind === "project"
        ? addProjectResource(detail.document.source?.id ?? detail.document.id, input)
        : addQuestItemResource(detail.document.source?.id ?? detail.document.id, input)}
      onRemoveResource={(resourceId) => detail.document.kind === "project"
        ? removeProjectResource(detail.document.source?.id ?? detail.document.id, resourceId)
        : removeQuestItemResource(detail.document.source?.id ?? detail.document.id, resourceId)}
      onBackingDocumentChange={(document) => {
        acceptDocument(document);
      }}
      variant={props.panel ? "panel" : "full"}
      onNavigateMission={undefined}
      onNavigateQuestItem={undefined}
    />
  );
}

function documentToDetailMission(document: TlozDocument, users: DocumentUser[], resources: DocumentResource[] = []): TlozMissionDetail {
  const stringValue = (key: string) => {
    const value = documentValue(document, key);
    return typeof value === "string" && value ? value : undefined;
  };
  const numberValue = (key: string) => {
    const value = documentValue(document, key);
    return typeof value === "number" ? value : 0;
  };
  const ownerId = typeof document.properties.owner === "string"
    ? document.properties.owner
    : typeof document.properties.assignee === "string"
      ? document.properties.assignee
      : "unassigned";
  const project = document.kind === "project"
    ? {
        id: document.source?.id ?? document.id,
        slug: document.projectSlug ?? document.publicId,
        name: document.title,
        description: document.summary,
        descriptionDetail: document.body,
        color: typeof document.properties.color === "string" ? document.properties.color : "#3A47B5",
        icon: typeof document.properties.icon === "string" ? document.properties.icon : "FolderKanban",
        status: "active",
        type: "normal",
        ownerId,
        startDate: stringValue("start") ?? document.createdAt.slice(0, 10),
        dueDate: stringValue("due"),
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      } satisfies TlozProject
    : undefined;
  const checklist = parseMarkdownChecklist(document.body).map((item, position) => ({
    id: `${document.id}-checklist-${position}`,
    missionId: document.source?.id ?? document.id,
    title: item.title,
    completed: item.completed,
    position,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  }));
  return {
    id: document.source?.id ?? document.id,
    displayId: document.publicId,
    title: document.title,
    description: document.summary,
    descriptionDetail: document.body,
    icon: typeof document.properties.icon === "string" ? document.properties.icon : document.kind === "inventory" ? "PackageOpen" : "FolderKanban",
    type: typeof document.properties.category === "string" ? document.properties.category : document.kind === "inventory" ? "inventory" : "project",
    status: typeof document.properties.status === "string" ? document.properties.status : "later",
    ownerId,
    projectId: project?.id,
    startDate: stringValue("start"),
    dueDate: stringValue("due"),
    progress: numberValue("progress"),
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    owner: (users.find((user) => user.id === ownerId) ?? { id: ownerId, name: "Sin responsable" }) as UserProfile,
    project,
    dependencies: [],
    questItems: [],
    requiredQuestItems: [],
    checklist,
    checklistCount: checklist.length,
    completed: checklist.filter((item) => item.completed).length,
    resources,
    requiredBy: [],
    missionQuestItems: [],
  };
}

function documentResourceKind(kind: TlozDocument["kind"]): "project" | "inventory" {
  return kind === "project" ? "project" : "inventory";
}

function documentHref(document: TlozDocument) {
  return document.kind === "project"
    ? `/projects/${encodeURIComponent(document.publicId)}`
    : inventoryItemHref(document.publicId);
}
