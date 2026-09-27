import type { CollectionSearchParams } from "../../components/tloz/collection-query";
import { DocumentCollectionPage } from "../../components/tloz/document-collection-page";

export default async function InventoryPage({ searchParams }: { searchParams: Promise<CollectionSearchParams> }) {
  const params = await searchParams;
  const { cursor } = params;
  return (
    <DocumentCollectionPage searchParams={params}
      definitionKey="inventory"
      kind="inventory"
      title="Inventory"
      createKind="inventory"
      cursor={cursor}
      basePath="/inventory"
    />
  );
}
