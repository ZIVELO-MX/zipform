import { CanonicalPresentationPage } from "../../components/tloz/canonical-presentation-page";

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ cursor?: string }> }) {
  const { cursor } = await searchParams;
  return <CanonicalPresentationPage presentation="library" title="Library" cursor={cursor} />;
}
