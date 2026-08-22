import type { Metadata } from "next";
import { getCurrentUser } from "../lib/data";
import { getTlozMissions, getTlozProjectDocuments, getTlozProjects } from "../lib/tloz-data";
import { AppShell } from "../components/app-shell";
import { Toaster } from "@tloz/ui";
import type { TlozProject } from "@tloz/types";
import { tlozUiCapabilities } from "../lib/authorization";
import "./globals.css";
import "yet-another-react-lightbox/styles.css";

export const metadata: Metadata = {
  title: "TLOZ",
  description: "Workspace documental de Zivelo"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, projects, missions, documents] = await Promise.all([
    getCurrentUser(),
    getTlozProjects(),
    getTlozMissions(),
    getTlozProjectDocuments(),
  ]);

  const doneStatuses = new Map(
    documents.data
      .filter((document) => document.source)
      .map((document) => [
        document.source!.id,
        new Set(
          document.contract?.fields
            .find((field) => field.key === "status")
            ?.options.filter((option) => option.role === "done")
            .map((option) => option.value) ?? ["completed"],
        ),
      ]),
  );
  const projectActiveCounts = new Map<string, number>();
  const projectActivity = new Map<string, string>();
  for (const mission of missions) {
    const completed = mission.projectId
      ? doneStatuses.get(mission.projectId)?.has(mission.status) ?? mission.status === "completed"
      : mission.status === "completed";
    if (mission.projectId && !completed) {
      projectActiveCounts.set(mission.projectId, (projectActiveCounts.get(mission.projectId) ?? 0) + 1);
      if (!projectActivity.has(mission.projectId) || mission.updatedAt > projectActivity.get(mission.projectId)!) projectActivity.set(mission.projectId, mission.updatedAt);
    }
  }
  for (const project of projects) if (!projectActivity.has(project.id) || project.updatedAt > projectActivity.get(project.id)!) projectActivity.set(project.id, project.updatedAt);

  return (
    <html lang="es">
      <body>
        <AppShell user={user} capabilities={tlozUiCapabilities(user)} tlozProjects={projects} projectActiveCounts={projectActiveCounts} projectActivity={projectActivity}>
          {children}
        </AppShell>
        <Toaster />
      </body>
    </html>
  );
}
