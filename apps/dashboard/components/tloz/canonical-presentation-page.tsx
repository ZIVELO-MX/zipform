import { collectionQueryFilters, collectionQueryHref, resolveCollectionQuery, type CollectionSearchParams } from "./collection-query";
import { notFound } from "next/navigation";
import { getCanonicalContainer, getCanonicalContents, getTlozUsers } from "../../lib/tloz-data";
import { TlozPageShell } from "./tloz-shell";
import { ContainerContentCollection } from "./container-content-collection";
import { canonicalCollectionViews, canonicalControlKind } from "./container-content-view-model";

export async function CanonicalPresentationPage({ presentation, title, cursor, searchParams = {} }: { presentation: "workshop" | "library"; title: string; cursor?: string; searchParams?: CollectionSearchParams }) {
  const container = await getCanonicalContainer(presentation);
  if (!container) notFound();
  const users = await getTlozUsers();
  const query = resolveCollectionQuery(searchParams, users);
  const contents = await getCanonicalContents(container.id, cursor, collectionQueryFilters(query, container.definition.fields.find((field) => field.key === "status")?.options ?? []));
  const supportedViews = canonicalCollectionViews(container.definition);
  const defaultView = supportedViews.includes(container.definition.defaultView as typeof supportedViews[number])
    ? container.definition.defaultView as typeof supportedViews[number]
    : supportedViews[0] ?? "table";
  return (
    <TlozPageShell
      title={title}
      breadcrumb={[{ label: "Lobby", href: "/" }, title]}
      supportedViews={supportedViews}
      defaultView={defaultView}
      stateScope={presentation}
      controlKind={canonicalControlKind(presentation)}
      createKind={presentation}
      canonicalContainer={container}
      documentNavigation={{ documents: [], users }}
      collectionQuery={query}
    >
      <ContainerContentCollection
        container={container}
        initialContents={contents.data}
        users={users}
        currentCursor={cursor}
        nextCursor={contents.nextCursor}
        basePath={collectionQueryHref(`/${presentation}`, "", query)}
      />
    </TlozPageShell>
  );
}
