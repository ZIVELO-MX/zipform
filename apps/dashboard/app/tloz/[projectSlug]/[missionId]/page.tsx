import { redirect } from "next/navigation";

export default async function LegacyMissionRoute({
  params,
}: {
  params: Promise<{ projectSlug: string; missionId: string }>;
}) {
  const { projectSlug, missionId } = await params;
  redirect(`/${encodeURIComponent(projectSlug)}/${encodeURIComponent(missionId)}`);
}
