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
import { TlozCapabilitiesProvider } from "./tloz/tloz-capabilities";
import type { TlozUiCapabilities } from "../lib/authorization";
export { buildTlozSections } from "./tloz-sidebar";

type AppShellProps = {
  children: ReactNode;
  user: UserProfile;
  capabilities: TlozUiCapabilities;
  tlozProjects?: TlozProject[];
  projectActiveCounts?: Map<string, number>;
  projectActivity?: Map<string, string>;
};

const SIDEBAR_STATE_KEY = "tloz-sidebar-state";
const SIDEBAR_WIDTH_KEY = "tloz-sidebar-width";

export function AppShell({ children, user, capabilities, tlozProjects = [], projectActiveCounts = new Map(), projectActivity = new Map() }: AppShellProps) {
  const pathname = usePathname();
  if (pathname === "/login") return children;

  return (
    <TooltipProvider delayDuration={180}>
      <Suspense fallback={null}>
        <DashboardLayoutClient user={user} capabilities={capabilities} tlozProjects={tlozProjects} projectActiveCounts={projectActiveCounts} projectActivity={projectActivity}>
          {children}
        </DashboardLayoutClient>
      </Suspense>
    </TooltipProvider>
  );
}

function DashboardLayoutClient({ children, user, capabilities, tlozProjects, projectActiveCounts, projectActivity }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(284);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarLoaded, setSidebarLoaded] = useState(false);

  const tlozSections = useMemo(
    () => buildTlozSections(tlozProjects ?? [], projectActiveCounts ?? new Map(), projectActivity ?? new Map()),
    [projectActivity, tlozProjects, projectActiveCounts]
  );

  useEffect(() => {
    try {
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
    } catch { /* Preferences are optional when browser storage is blocked. */ }
    setSidebarLoaded(true);
  }, []);

  useEffect(() => {
    if (!sidebarLoaded) return;
    try {
      window.localStorage.setItem(SIDEBAR_STATE_KEY, collapsed ? "collapsed" : "expanded");
    } catch { /* Keep using the in-memory sidebar state. */ }
  }, [collapsed, sidebarLoaded]);

  const handleResize = useCallback((width: number) => {
    const clamped = Math.max(220, Math.min(500, width));
    setSidebarWidth(clamped);
    document.documentElement.style.setProperty("--sidebar-expanded", `${clamped}px`);
    try { window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(clamped)); } catch { /* Resizing remains available. */ }
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isModB = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b";
      if (!isModB || event.defaultPrevented || (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable=true]"))) return;

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
    const media = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => { if (media.matches) setMobileMenuOpen(false); };
    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <TlozCapabilitiesProvider capabilities={capabilities} currentUserId={user.id}><div
      className="shell shell-tloz min-h-dvh bg-ivory text-carbon"
      data-sidebar={collapsed ? "collapsed" : "expanded"}
    >
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
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

      <main id="main-content" className="main-surface tloz-main-surface min-w-0" tabIndex={-1}>{children}</main>

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

      <SettingsDialog key={String(settingsOpen)} open={settingsOpen} onOpenChange={setSettingsOpen} user={user} />
    </div></TlozCapabilitiesProvider>
  );
}
