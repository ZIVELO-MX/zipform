import { notFound } from "next/navigation";
import { SystemEntityDetailPage } from "../../../components/tloz/system-entity-detail-page";
import { TlozPageShell } from "../../../components/tloz/tloz-shell";
import {
  getTlozDocument,
  getTlozMissions,
  getTlozQuestItems,
  getTlozResources,
  getTlozUsers,
} from "../../../lib/tloz-data";

export default async function InventoryDocumentPage({
  params,
}: {
  params: Promise<{ inventoryId: string }>;
}) {
  const { inventoryId } = await params;
  const [document, items, missions, users, resources] = await Promise.all([
    getTlozDocument(inventoryId),
    getTlozQuestItems(),
    getTlozMissions(),
    getTlozUsers(),
    getTlozResources(),
  ]);
  const sourceId = document?.kind === "inventory" ? document.source?.id : inventoryId;
  const item = items.find((candidate) => candidate.id === sourceId);
  if (!item) notFound();

  return (
    <TlozPageShell title={item.name} showHeader={false}>
      <div className="min-h-full bg-[#FAFAF9]">
        <SystemEntityDetailPage
          variant="inventory"
          entity={item}
          missions={missions}
          users={users}
          resources={resources.filter((resource) => resource.questItemId === item.id)}
        />
      </div>
    </TlozPageShell>
  );
}
