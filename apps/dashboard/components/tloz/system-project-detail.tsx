"use client";

import { useEffect, useState } from "react";
import { SlideOver } from "@tloz/ui";
import type {
  TlozDocument,
  TlozDocumentDefinition,
  TlozProject,
  TlozQuestItem,
  TlozResource,
} from "@tloz/types";
import type { TlozMissionRecord } from "../../lib/tloz-data";
import { getDocumentDetailOptions } from "../../app/tloz/actions";
import { DocumentDetail } from "./document-view-renderer";

type DetailUser = {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
};

export function SystemEntitySlideOver({
  detail,
  documentId,
  onClose,
  users,
}: {
  detail: ({ variant: "project"; entity: TlozProject } | { variant: "inventory"; entity: TlozQuestItem }) | null;
  documentId?: string;
  onClose: () => void;
  onChange: (entity: TlozProject | TlozQuestItem) => void;
  users: DetailUser[];
  missions: TlozMissionRecord[];
  resources: TlozResource[];
  onNavigateMission?: (mission: TlozMissionRecord) => void;
}) {
  return (
    <SlideOver
      open={Boolean(detail)}
      title={detail?.entity.name ?? "Detalle"}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {detail ? (
        <SystemDocumentDetail
          entityId={documentId ?? detail.entity.id}
          users={users}
          panel
        />
      ) : null}
    </SlideOver>
  );
}

export function SystemDocumentDetail({
  entityId,
  users,
  panel = false,
}: {
  entityId: string;
  users: DetailUser[];
  panel?: boolean;
}) {
  const [result, setResult] = useState<{
    document: TlozDocument;
    definition: TlozDocumentDefinition;
  } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setResult(null);
    setError(false);
    void getDocumentDetailOptions(entityId)
      .then((value) => {
        if (active) setResult(value);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [entityId]);

  if (error) {
    return (
      <div className="p-6 text-sm font-semibold text-[#B91C22]" role="alert">
        No se pudo cargar el documento.
      </div>
    );
  }
  if (!result) {
    return (
      <div
        className="flex min-h-40 items-center justify-center gap-2 p-6 text-sm text-carbon/50"
        role="status"
        aria-live="polite"
      >
        <span
          className="size-4 animate-spin rounded-full border-2 border-carbon/20 border-t-carbon/70"
          aria-hidden="true"
        />
        Cargando documento…
      </div>
    );
  }
  return (
    <DocumentDetail
      document={result.document}
      definition={result.definition}
      users={users}
      panel={panel}
    />
  );
}
