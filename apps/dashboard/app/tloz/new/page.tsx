import { redirect } from "next/navigation";

export default async function LegacyNewEntityPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind } = await searchParams;
  redirect(kind ? `/new?kind=${encodeURIComponent(kind)}` : "/new");
}
