import type { TlozDocumentKind } from "@tloz/types";
import { notFound } from "next/navigation";
import {
  getTlozDocumentDefinition,
  getTlozDocuments,
  getTlozUsers,
} from "../../lib/tloz-data";
import type { TlozView } from "../../lib/tloz-routes";
import { DocumentViewRenderer } from "./document-view-renderer";
import { CreateNewEntityButton, type TlozCreateKind } from "./tloz-create";
import { TlozPageShell } from "./tloz-shell";

export async function DocumentCollectionPage({
  definitionKey,
  kind,
  title,
  createKind,
}: {
  definitionKey: string;
  kind: TlozDocumentKind;
  title: string;
  createKind: TlozCreateKind;
}) {
  const [documents, definition, users] = await Promise.all([
    getTlozDocuments(kind),
    getTlozDocumentDefinition(definitionKey),
    getTlozUsers(),
  ]);
  if (!definition || definition.kind !== kind) notFound();
  const configuredViews = new Set(definition.views.map((view) => view.id));
  const collectionViews: TlozView[] = (["list", "table"] satisfies TlozView[])
    .filter((view) => configuredViews.has(view));
  const defaultView = collectionViews.includes(definition.defaultView as TlozView)
    ? definition.defaultView as TlozView
    : collectionViews.includes("table")
      ? "table"
      : "list";

  return (
    <TlozPageShell
      title={title}
      breadcrumb={["Lobby", title]}
      supportedViews={collectionViews}
      defaultView={defaultView}
      missionControls={false}
      inventoryControls={kind === "inventory"}
      createKind={createKind}
      stateScope={definition.key}
      documentNavigation={{ documents: documents.data, users }}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <DocumentViewRenderer
          documents={documents.data}
          definition={definition}
          users={users}
        />
        <div className="px-[26px] pb-[26px]">
          <CreateNewEntityButton />
        </div>
      </div>
    </TlozPageShell>
  );
}
