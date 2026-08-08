import { notFound } from "next/navigation";
import { getCanonicalContainer, getCanonicalContent, getTlozUsers } from "../../../lib/tloz-data";
import { ContainerContentDetail } from "../../../components/tloz/container-content-detail";
import { TlozPageShell } from "../../../components/tloz/tloz-shell";

export default async function LibraryContentPage({ params }: { params: Promise<{ contentId: string }> }) {
  const content = await getCanonicalContent((await params).contentId);
  if (!content || content.presentation !== "library") notFound();
  const [container, users] = await Promise.all([getCanonicalContainer(content.containerId), getTlozUsers()]);
  if (!container || container.presentation !== "library") notFound();
  return <TlozPageShell title={content.title} breadcrumb={[{ label: "Library", href: "/library" }, content.title]} supportedViews={[]} showControls documentNavigation={{ documents: [], users }}><ContainerContentDetail container={container} content={content} users={users} variant="full" /></TlozPageShell>;
}
