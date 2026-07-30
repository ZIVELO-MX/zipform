import { notFound } from "next/navigation";
import { getCurrentUser } from "../../lib/data";
import { getCanonicalContainer, getCanonicalContents, getTlozUsers } from "../../lib/tloz-data";
import { TlozPageShell } from "./tloz-shell";
import { ContainerContentCollection } from "./container-content-collection";
import { ContainerContentCreateControl, ContainerContentCreateProvider } from "./container-content-create";
import { canonicalCollectionViews, canonicalControlKind } from "./container-content-view-model";

export async function CanonicalPresentationPage({ presentation, title }: { presentation: "workshop" | "library"; title: string }) {
  const container = await getCanonicalContainer(presentation);
  if (!container) notFound();
  const [contents, users, currentUser] = await Promise.all([
    getCanonicalContents(container.id),
    getTlozUsers(),
    getCurrentUser(),
  ]);
  const supportedViews = canonicalCollectionViews(container.definition);
  const defaultView = supportedViews.includes(container.definition.defaultView as typeof supportedViews[number])
    ? container.definition.defaultView as typeof supportedViews[number]
    : supportedViews[0] ?? "table";
  return (
    <ContainerContentCreateProvider container={container} users={users} currentUserId={currentUser.id}>
      <TlozPageShell
        title={title}
        breadcrumb={[{ label: "Lobby", href: "/" }, title]}
        supportedViews={supportedViews}
        defaultView={defaultView}
        stateScope={presentation}
        controlKind={canonicalControlKind(presentation)}
        controlCreate={<ContainerContentCreateControl />}
        documentNavigation={{ documents: [], users }}
      >
        <ContainerContentCollection container={container} initialContents={contents} users={users} />
      </TlozPageShell>
    </ContainerContentCreateProvider>
  );
}
