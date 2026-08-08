import { Suspense } from "react";
import { TlozLoading } from "../../components/tloz/tloz-loading";
import { ProjectWorkspacePage } from "../../components/tloz/project-workspace-page";

export default async function TlozPage() {
  return (
    <Suspense fallback={<TlozLoading />}>
      <ProjectWorkspacePage projectSlug="tloz" />
    </Suspense>
  );
}
