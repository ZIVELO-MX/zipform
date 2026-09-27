import { collectionQueryFilters, collectionQueryHref, resolveCollectionQuery, type CollectionSearchParams } from "./collection-query";
import type { TlozDocumentKind } from "@tloz/types";
import { notFound } from "next/navigation";
import {
  getTlozDocumentDefinition,
  getTlozDocumentPage,
  getTlozUsers,
} from "../../lib/tloz-data";
import type { TlozView } from "../../lib/tloz-routes";
import { DocumentViewRenderer } from "./document-view-renderer";
import { CreateNewEntityButton, type TlozCreateKind } from "./tloz-create";
import { TlozPageShell } from "./tloz-shell";
import { CollectionPagination } from "./collection-pagination";

export async function DocumentCollectionPage({
  definitionKey,
  kind,
  title,
  createKind,
  cursor,
  basePath,
  searchParams = {},
}: {
  definitionKey: string;
  kind: TlozDocumentKind;
  title: string;
  createKind: TlozCreateKind;
  cursor?: string;
  basePath: string;
  searchParams?: CollectionSearchParams;
}) {
  const [definition, users] = await Promise.all([
    getTlozDocumentDefinition(definitionKey),
    getTlozUsers(),
  ]);
  if (!definition || definition.kind !== kind) notFound();
  const query = resolveCollectionQuery(searchParams, users);
  const documents = await getTlozDocumentPage(kind, undefined, cursor, collectionQueryFilters(query, definition.fields.find((field) => field.key === "status")?.options ?? []));
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
      breadcrumb={[{ label: "Lobby", href: "/" }, title]}
      supportedViews={collectionViews}
      defaultView={defaultView}
      createKind={createKind}
      stateScope={definition.key}
      documentNavigation={{ documents: documents.data, users }}
      collectionQuery={query}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <DocumentViewRenderer
          documents={documents.data}
          definition={definition}
          users={users}
        />
        <CollectionPagination basePath={collectionQueryHref(basePath, "", query)} currentCursor={cursor} nextCursor={documents.nextCursor} />
        <div className="px-[26px] pb-[26px]">
          <CreateNewEntityButton />
        </div>
      </div>
    </TlozPageShell>
  );
}
