import { TlozPageShell } from "../../../components/tloz/tloz-shell";
import { getTlozQuestItems } from "../../../lib/tloz-data";
import { QuestItemsClient } from "./quest-items-client";

export default async function QuestItemsPage() {
  const questItems = await getTlozQuestItems();
  return (
    <TlozPageShell title="Missions" detailLabel="Inventory" showDisplaySwitcher={false}>
      <QuestItemsClient questItems={questItems} />
    </TlozPageShell>
  );
}
