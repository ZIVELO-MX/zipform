"use client";

import {
  ArrowLeft,
  FileText,
  FolderKanban,
  Home,
  LayoutDashboard,
  Menu,
  PackageOpen,
  Sword,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { TlozProject, UserProfile } from "@zipform/types";
import {
  DesktopSidebar,
  isActive,
  MobileMenuPanel,
  NavItem,
  NavSection,
  TooltipProvider,
} from "@zipform/ui";
import { Suspense, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { resolveMissionIcon } from "./tloz/tloz-utils";
import { projectHref } from "../lib/tloz-routes";

type AppShellProps = {
  children: ReactNode;
  user: UserProfile;
  tlozProjects?: TlozProject[];
  projectActiveCounts?: Map<string, number>;
};

const SIDEBAR_STATE_KEY = "zipform-sidebar-state";
const SIDEBAR_WIDTH_KEY = "zipform-sidebar-width";

function getEnabledApps(): NavItem[] {
  return [
    { label: "Panel", href: "/", icon: Home },
    { label: "Cotizaciones", href: "/quotes", icon: FileText },
    { label: "TLOZ", href: "/tloz", icon: Sword },
  ];
}

const navItems = getEnabledApps();

const tlozContextItem: NavItem = { label: "TLOZ", href: "/", icon: ArrowLeft };

function buildTlozSections(projects: TlozProject[], projectActiveCounts: Map<string, number>): NavSection[] {
  const projectItems: NavItem[] = projects.map((project) => {
    const Icon = resolveMissionIcon(project.icon);
    return {
      label: project.name,
      href: projectHref(project),
      icon: Icon,
      badge: projectActiveCounts.get(project.id) ?? 0,
    };
  });

  return [
    {
      items: [
        { label: "Lobby", href: "/tloz", icon: LayoutDashboard, exact: true },
      ],
    },
    {
      label: "Sistema",
      collapsible: true,
      defaultCollapsed: false,
      items: [
        { label: "Inventory", href: "/tloz/inventory", icon: PackageOpen },
        { label: "Projects", href: "/tloz/projects", icon: FolderKanban },
      ],
    },
    ...(projectItems.length > 0
      ? [
        {
          label: "Proyectos",
          collapsible: true,
          defaultCollapsed: false,
          items: projectItems,
        } satisfies NavSection,
      ]
      : []),
  ];
}

export function AppShell({ children, user, tlozProjects = [], projectActiveCounts = new Map() }: AppShellProps) {
  const pathname = usePathname();
  if (pathname === "/login") return children;

  return (
    <TooltipProvider delayDuration={180}>
      <Suspense fallback={null}>
        <DashboardLayoutClient user={user} tlozProjects={tlozProjects} projectActiveCounts={projectActiveCounts}>
          {children}
        </DashboardLayoutClient>
      </Suspense>
    </TooltipProvider>
  );
}

function DashboardLayoutClient({ children, user, tlozProjects, projectActiveCounts }: AppShellProps) {
  const pathname = usePathname();
  const isTloz = pathname === "/tloz" || pathname.startsWith("/tloz/");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(284);

  const tlozSections = useMemo(
    () => buildTlozSections(tlozProjects ?? [], projectActiveCounts ?? new Map()),
    [tlozProjects, projectActiveCounts]
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

  const title = useMemo(() => {
    if (pathname === "/") return "Panel";
    const current = navItems.find((item) => isActive(pathname, item.href));
    return current?.label ?? "Zipform";
  }, [pathname]);

  return (
    <div
      className={`shell min-h-dvh bg-ivory text-carbon${isTloz ? " shell-tloz" : ""}`}
      data-sidebar={collapsed ? "collapsed" : "expanded"}
    >
      <DesktopSidebar
        collapsed={collapsed}
        pathname={pathname}
        user={user}
        items={navItems}
        sections={isTloz ? tlozSections : undefined}
        contextItem={isTloz ? tlozContextItem : undefined}
        sidebarWidth={sidebarWidth}
        onResize={handleResize}
        onToggleCollapsed={() => setCollapsed((current) => !current)}
        onSignOut={() => signOut({ callbackUrl: "/login" })}
      />

      <main className={`main-surface min-w-0${isTloz ? " tloz-main-surface" : ""}`}>{children}</main>

      <MobileMenuPanel
        open={mobileMenuOpen}
        pathname={pathname}
        user={user}
        items={navItems}
        sections={isTloz ? tlozSections : undefined}
        contextItem={isTloz ? tlozContextItem : undefined}
        onClose={() => setMobileMenuOpen(false)}
        onSignOut={() => signOut({ callbackUrl: "/login" })}
      />

          {!isTloz ? <div className="fixed inset-x-0 top-0 z-20 flex h-12 items-center border-b border-carbon/10 bg-paper/90 backdrop-blur md:hidden">
        <button
          type="button"
          className="grid size-12 shrink-0 place-items-center text-carbon/70"
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          {mobileMenuOpen ? <Menu size={20} /> : <Menu size={20} />}
        </button>
        <span className="flex-1 text-center text-sm font-black">{title}</span>
        <div className="size-12 shrink-0" />
      </div> : null}
    </div>
  );
}
