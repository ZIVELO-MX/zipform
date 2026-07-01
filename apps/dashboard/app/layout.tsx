import type { Metadata } from "next";
import { dataClient } from "../lib/data";
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
    dataClient.user.getCurrent(),
    dataClient.tloz.getProjects(),
    dataClient.tloz.getMissions(),
  ]);

  const projectActiveCounts = new Map<string, number>();
  for (const mission of missions) {
    if (mission.projectId && mission.status !== "completed") {
      projectActiveCounts.set(mission.projectId, (projectActiveCounts.get(mission.projectId) ?? 0) + 1);
    }
  }

  return (
    <html lang="es">
      <body>
        <AppShell user={user} tlozProjects={projects} projectActiveCounts={projectActiveCounts}>
          {children}
        </AppShell>
        <Toaster />
      </body>
    </html>
  );
}
