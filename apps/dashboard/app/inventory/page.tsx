import { TlozPageShell } from "../../components/tloz/tloz-shell";
import { InventoryProjectView } from "../../components/tloz/system-project-views";
import { CreateNewEntityButton } from "../../components/tloz/tloz-create";
import {
  getTlozInventoryDocuments,
  getTlozMissions,
  getTlozQuestItems,
  getTlozResources,
  getTlozUsers,
} from "../../lib/tloz-data";

export default async function InventoryPage() {
  const [items, missions, users, resources, documents] = await Promise.all([
    getTlozQuestItems(),
    getTlozMissions(),
    getTlozUsers(),
    getTlozResources(),
    getTlozInventoryDocuments(),
  ]);
  const publicIds = Object.fromEntries(
    documents.data
      .filter((document) => document.source)
      .map((document) => [document.source!.id, document.publicId]),
  );

  return (
    <TlozPageShell
      title="Inventory"
      supportedViews={["table", "list"]}
      defaultView="table"
      missionControls={false}
      inventoryControls
      createKind="inventory"
      stateScope="inventory"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <InventoryProjectView
          items={items}
          missions={missions}
          users={users}
          resources={resources}
          publicIds={publicIds}
        />
        <div className="px-[26px] pb-[26px]"><CreateNewEntityButton /></div>
      </div>
    </TlozPageShell>
  );
}
