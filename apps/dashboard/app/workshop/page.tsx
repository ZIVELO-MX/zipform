import type { CollectionSearchParams } from "../../components/tloz/collection-query";
import { CanonicalPresentationPage } from "../../components/tloz/canonical-presentation-page";

export default async function WorkshopPage({ searchParams }: { searchParams: Promise<CollectionSearchParams> }) {
  const params = await searchParams;
  const { cursor } = params;
  return <CanonicalPresentationPage searchParams={params} presentation="workshop" title="Workshop" cursor={cursor} />;
}
