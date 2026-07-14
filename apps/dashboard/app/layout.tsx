import type { Metadata } from "next";
import { getCurrentUser } from "../lib/data";
import { getTlozMissions, getTlozProjects } from "../lib/tloz-data";
import { AppShell } from "../components/app-shell";
import { Toaster } from "@zipform/ui";
import type { TlozProject } from "@zipform/types";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zipform",
  description: "Dashboard interno de la plataforma Zivelo"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, projects, missions] = await Promise.all([
    getCurrentUser(),
    getTlozProjects(),
    getTlozMissions(),
  ]);

  const projectActiveCounts = new Map<string, number>();
  const projectActivity = new Map<string, string>();
  for (const mission of missions) {
    if (mission.projectId && mission.status !== "completed") {
      projectActiveCounts.set(mission.projectId, (projectActiveCounts.get(mission.projectId) ?? 0) + 1);
      if (!projectActivity.has(mission.projectId) || mission.updatedAt > projectActivity.get(mission.projectId)!) projectActivity.set(mission.projectId, mission.updatedAt);
    }
  }
  for (const project of projects) if (!projectActivity.has(project.id) || project.updatedAt > projectActivity.get(project.id)!) projectActivity.set(project.id, project.updatedAt);

  return (
    <html lang="es">
      <body>
        <AppShell user={user} tlozProjects={projects} projectActiveCounts={projectActiveCounts} projectActivity={projectActivity}>
          {children}
        </AppShell>
        <Toaster />
      </body>
    </html>
  );
}
