import { notFound } from "next/navigation";
import { getCanonicalContainer, getCanonicalContents, getTlozUsers } from "../../lib/tloz-data";
import { TlozPageShell } from "./tloz-shell";
import { ContainerContentCollection } from "./container-content-collection";
import { canonicalCollectionViews, canonicalControlKind } from "./container-content-view-model";

export async function CanonicalPresentationPage({ presentation, title }: { presentation: "workshop" | "library"; title: string }) {
  const container = await getCanonicalContainer(presentation);
  if (!container) notFound();
  const [contents, users] = await Promise.all([
    getCanonicalContents(container.id),
    getTlozUsers(),
  ]);
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
    >
      <ContainerContentCollection container={container} initialContents={contents} users={users} />
    </TlozPageShell>
  );
}
