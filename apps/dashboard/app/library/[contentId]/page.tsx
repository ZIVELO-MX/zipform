import { notFound } from "next/navigation";
import { getCanonicalContent } from "../../../lib/tloz-data";
import { CanonicalContentDetail } from "../../../components/tloz/canonical-content-detail";
import { TlozPageShell } from "../../../components/tloz/tloz-shell";

export default async function LibraryContentPage({ params }: { params: Promise<{ contentId: string }> }) {
  const content = await getCanonicalContent((await params).contentId);
  if (!content || content.presentation !== "library") notFound();
  return <TlozPageShell title={content.title} breadcrumb={[{ label: "Library", href: "/library" }, content.title]} supportedViews={[]} showControls={false} documentNavigation={{ documents: [], users: [] }}><CanonicalContentDetail content={content} presentation="library" /></TlozPageShell>;
}
