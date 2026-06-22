import type { Metadata } from "next";
import { dataClient } from "../lib/data";
import { AppShell } from "../components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zipform",
  description: "Internal Zivelo platform dashboard"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [apps, user] = await Promise.all([dataClient.apps.list(), dataClient.user.getCurrent()]);

  return (
    <html lang="en">
      <body>
        <AppShell apps={apps} user={user}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
