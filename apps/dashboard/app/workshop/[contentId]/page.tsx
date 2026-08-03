import { notFound } from "next/navigation";
import { getCanonicalContainer, getCanonicalContent, getTlozUsers } from "../../../lib/tloz-data";
import { ContainerContentDetail } from "../../../components/tloz/container-content-detail";
import { TlozPageShell } from "../../../components/tloz/tloz-shell";

export default async function WorkshopContentPage({ params }: { params: Promise<{ contentId: string }> }) {
  const content = await getCanonicalContent((await params).contentId);
  if (!content || content.presentation !== "workshop") notFound();
  const [container, users] = await Promise.all([getCanonicalContainer(content.containerId), getTlozUsers()]);
  if (!container || container.presentation !== "workshop") notFound();
  return <TlozPageShell title={content.title} breadcrumb={[{ label: "Workshop", href: "/workshop" }, content.title]} supportedViews={[]} showControls documentNavigation={{ documents: [], users }}><ContainerContentDetail container={container} content={content} users={users} variant="full" /></TlozPageShell>;
}
