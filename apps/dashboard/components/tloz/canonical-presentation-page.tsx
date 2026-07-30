import Link from "next/link";
import { notFound } from "next/navigation";
import type { ContainerRecord } from "@tloz/types";
import { getCanonicalContainer, getCanonicalContents } from "../../lib/tloz-data";
import { TlozPageShell } from "./tloz-shell";
import { CanonicalContentCollection } from "./canonical-content-collection";

export async function CanonicalPresentationPage({ presentation, title }: { presentation: "workshop" | "library"; title: string }) {
  const container = await getCanonicalContainer(presentation);
  if (!container) notFound();
  const contents = await getCanonicalContents(container.id);
  return (
    <TlozPageShell
      title={title}
      breadcrumb={[{ label: "Lobby", href: "/" }, title]}
      supportedViews={["list", "table"]}
      defaultView={container.definition.defaultView === "table" ? "table" : "list"}
      stateScope={presentation}
      showControls={false}
      documentNavigation={{ documents: [], users: [] }}
    >
      <CanonicalContentCollection container={container} initialContents={contents} presentation={presentation} />
    </TlozPageShell>
  );
}

export function CanonicalPresentationLink({ presentation, title }: { presentation: "workshop" | "library"; title: string }) {
  return <Link href={`/${presentation}`} className="text-[12px] font-semibold text-zivelo hover:underline">{title}</Link>;
}

export type CanonicalContainer = ContainerRecord;
