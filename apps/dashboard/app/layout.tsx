import type { Metadata } from "next";
import { dataClient } from "../lib/data";
import { AppShell } from "../components/app-shell";
import { Toaster } from "@zipform/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zipform",
  description: "Dashboard interno de la plataforma Zivelo"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await dataClient.user.getCurrent();

  return (
    <html lang="es">
      <body>
        <AppShell user={user}>
          {children}
        </AppShell>
        <Toaster />
      </body>
    </html>
  );
}
