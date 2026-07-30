"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { TlozProject, UserProfile } from "@tloz/types";
import {
  DesktopSidebar,
  MobileMenuPanel,
  TooltipProvider,
} from "@tloz/ui";
import { Suspense, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { SettingsDialog } from "./settings-dialog";
import { buildTlozSections } from "./tloz-sidebar";
export { buildTlozSections } from "./tloz-sidebar";

type AppShellProps = {
  children: ReactNode;
  user: UserProfile;
  tlozProjects?: TlozProject[];
  projectActiveCounts?: Map<string, number>;
  projectActivity?: Map<string, string>;
};

const SIDEBAR_STATE_KEY = "tloz-sidebar-state";
const SIDEBAR_WIDTH_KEY = "tloz-sidebar-width";

export function AppShell({ children, user, tlozProjects = [], projectActiveCounts = new Map(), projectActivity = new Map() }: AppShellProps) {
  const pathname = usePathname();
  if (pathname === "/login") return children;

  return (
    <TooltipProvider delayDuration={180}>
      <Suspense fallback={null}>
        <DashboardLayoutClient user={user} tlozProjects={tlozProjects} projectActiveCounts={projectActiveCounts} projectActivity={projectActivity}>
          {children}
        </DashboardLayoutClient>
      </Suspense>
    </TooltipProvider>
  );
}

function DashboardLayoutClient({ children, user, tlozProjects, projectActiveCounts, projectActivity }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(284);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const tlozSections = useMemo(
    () => buildTlozSections(tlozProjects ?? [], projectActiveCounts ?? new Map(), projectActivity ?? new Map()),
    [projectActivity, tlozProjects, projectActiveCounts]
  );

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(SIDEBAR_STATE_KEY) === "collapsed");

    const storedWidth = window.localStorage.getItem(SIDEBAR_WIDTH_KEY);
    if (storedWidth) {
      const parsed = parseInt(storedWidth, 10);
      if (!isNaN(parsed)) {
        const clamped = Math.max(220, Math.min(500, parsed));
        setSidebarWidth(clamped);
        document.documentElement.style.setProperty("--sidebar-expanded", `${clamped}px`);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STATE_KEY, collapsed ? "collapsed" : "expanded");
  }, [collapsed]);

  const handleResize = useCallback((width: number) => {
    const clamped = Math.max(220, Math.min(500, width));
    setSidebarWidth(clamped);
    window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(clamped));
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isModB = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b";
      if (!isModB) return;

      event.preventDefault();
      setCollapsed((current) => !current);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onToggle() { setMobileMenuOpen((prev) => !prev); }
    window.addEventListener("toggle-mobile-menu", onToggle);
    return () => window.removeEventListener("toggle-mobile-menu", onToggle);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <div
      className="shell shell-tloz min-h-dvh bg-ivory text-carbon"
      data-sidebar={collapsed ? "collapsed" : "expanded"}
    >
      <DesktopSidebar
        collapsed={collapsed}
        pathname={pathname}
        user={user}
        items={[]}
        sections={tlozSections}
        sidebarWidth={sidebarWidth}
        onResize={handleResize}
        onToggleCollapsed={() => setCollapsed((current) => !current)}
        onSignOut={() => signOut({ callbackUrl: "/login" })}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="main-surface tloz-main-surface min-w-0">{children}</main>

      <MobileMenuPanel
        open={mobileMenuOpen}
        pathname={pathname}
        user={user}
        items={[]}
        sections={tlozSections}
        onClose={() => setMobileMenuOpen(false)}
        onSignOut={() => signOut({ callbackUrl: "/login" })}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} user={user} />
    </div>
  );
}
