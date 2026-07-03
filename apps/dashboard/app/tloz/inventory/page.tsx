import { TlozPageShell } from "../../../components/tloz/tloz-shell";
import { getTlozQuestItems } from "../../../lib/tloz-data";
import { InventoryClient } from "./inventory-client";

export default async function InventoryPage() {
  const questItems = await getTlozQuestItems();
  return (
    <TlozPageShell title="Missions" detailLabel="Inventory">
      <InventoryClient questItems={questItems} />
    </TlozPageShell>
  );
}
