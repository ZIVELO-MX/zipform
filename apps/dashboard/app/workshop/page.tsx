import { CanonicalPresentationPage } from "../../components/tloz/canonical-presentation-page";

export default async function WorkshopPage({ searchParams }: { searchParams: Promise<{ cursor?: string }> }) {
  const { cursor } = await searchParams;
  return <CanonicalPresentationPage presentation="workshop" title="Workshop" cursor={cursor} />;
}
