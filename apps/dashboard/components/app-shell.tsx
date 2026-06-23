"use client";

import { FileText, Home, Menu, Sword, X } from "lucide-react";
import { usePathname } from "next/navigation";
import type { UserProfile } from "@zipform/types";
import {
  DesktopSidebar,
  isActive,
  MobileBottomNav,
  MobileMenuPanel,
  NavItem,
  TooltipProvider,
  cn,
} from "@zipform/ui";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";

type AppShellProps = {
  children: ReactNode;
  user: UserProfile;
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

export function AppShell({ children, user }: AppShellProps) {
  return (
    <TooltipProvider delayDuration={180}>
      <DashboardLayoutClient user={user}>
        {children}
      </DashboardLayoutClient>
    </TooltipProvider>
  );
}

function DashboardLayoutClient({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(284);

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
      className="shell min-h-dvh bg-ivory text-carbon"
      data-sidebar={collapsed ? "collapsed" : "expanded"}
    >
      <DesktopSidebar
        collapsed={collapsed}
        pathname={pathname}
        user={user}
        items={navItems}
        sidebarWidth={sidebarWidth}
        onResize={handleResize}
        onToggleCollapsed={() => setCollapsed((current) => !current)}
      />

      <main className="main-surface min-w-0">{children}</main>

      <MobileBottomNav pathname={pathname} user={user} items={navItems} onOpenMenu={() => setMobileMenuOpen(true)} />
      <MobileMenuPanel
        open={mobileMenuOpen}
        pathname={pathname}
        user={user}
        items={navItems}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="fixed inset-x-0 top-0 z-20 flex h-12 items-center border-b border-carbon/10 bg-paper/90 backdrop-blur md:hidden">
        <button
          type="button"
          className="grid size-12 shrink-0 place-items-center text-carbon/70"
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <span className="flex-1 text-center text-sm font-black">{title}</span>
        <div className="size-12 shrink-0" />
      </div>
    </div>
  );
}
