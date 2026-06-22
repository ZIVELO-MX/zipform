"use client";

import {
  ChevronLeft,
  FileText,
  Home,
  LogOut,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sword,
  UserRound,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserProfile } from "@zipform/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn
} from "@zipform/ui";
import { type ComponentType, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";

type AppShellProps = {
  children: ReactNode;
  user: UserProfile;
};

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string; size?: number }>;
};

const SIDEBAR_STATE_KEY = "dashboard-sidebar-state";
const SIDEBAR_WIDTH_KEY = "dashboard-sidebar-width";
const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 500;
const SIDEBAR_DEFAULT_WIDTH = 284;

const navItems: NavItem[] = [
  { label: "Panel", href: "/", icon: Home },
  { label: "Cotizaciones", href: "/quotes", icon: FileText },
  { label: "TLOZ", href: "/tloz", icon: Sword },
];

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
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(SIDEBAR_STATE_KEY) === "collapsed");

    const storedWidth = window.localStorage.getItem(SIDEBAR_WIDTH_KEY);
    if (storedWidth) {
      const parsed = parseInt(storedWidth, 10);
      if (!isNaN(parsed)) {
        const clamped = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, parsed));
        setSidebarWidth(clamped);
        document.documentElement.style.setProperty("--sidebar-expanded", `${clamped}px`);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STATE_KEY, collapsed ? "collapsed" : "expanded");
  }, [collapsed]);

  const handleResize = useCallback((width: number) => {
    const clamped = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, width));
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
        sidebarWidth={sidebarWidth}
        onResize={handleResize}
        onToggleCollapsed={() => setCollapsed((current) => !current)}
      />

      <main className="main-surface min-w-0">{children}</main>

      <MobileBottomNav pathname={pathname} user={user} onOpenMenu={() => setMobileMenuOpen(true)} />
      <MobileMenuPanel
        open={mobileMenuOpen}
        user={user}
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

function DesktopSidebar({
  collapsed,
  pathname,
  user,
  sidebarWidth,
  onResize,
  onToggleCollapsed
}: {
  collapsed: boolean;
  pathname: string;
  user: UserProfile;
  sidebarWidth: number;
  onResize: (width: number) => void;
  onToggleCollapsed: () => void;
}) {
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = sidebarWidth;

      function handleMove(ev: MouseEvent) {
        const delta = startX - ev.clientX;
        const newWidth = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, startWidth - delta));
        document.documentElement.style.setProperty("--sidebar-expanded", `${newWidth}px`);
      }

      function handleUp() {
        const current = parseInt(document.documentElement.style.getPropertyValue("--sidebar-expanded"), 10);
        if (!isNaN(current)) {
          onResize(current);
        }
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      }

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [sidebarWidth, onResize]
  );

  return (
    <aside
      className="relative sticky top-0 hidden h-dvh bg-paper md:flex md:flex-col"
      aria-label="Navegación principal"
    >
      <div className="flex h-16 items-center gap-2 border-b border-carbon/10 px-3">
        <Link
          href="/"
          className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-zivelo text-lg font-black text-white shadow-[0_12px_24px_rgba(215,34,40,0.25)]"
          aria-label="Zipform inicio"
        >
          Z
        </Link>
        <div className={cn("min-w-0 flex-1", collapsed && "hidden")}>
          <p className="m-0 truncate text-sm font-black">Zipform</p>
          <p className="m-0 truncate text-xs font-semibold text-carbon/55">Plataforma Zivelo</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className={cn("shrink-0", collapsed && "hidden")}
          aria-label="Contraer barra"
          title="Cmd+B"
          onClick={onToggleCollapsed}
        >
          <PanelLeftClose size={18} />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 py-3">
        <nav className="grid gap-1" aria-label="Principal">
          {navItems.map((item) => (
            <SidebarLink key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={collapsed} />
          ))}
        </nav>
      </div>

      <div className="p-2">
        {collapsed ? (
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Expandir barra"
            title="Cmd+B"
            onClick={onToggleCollapsed}
            className="mb-2"
          >
            <PanelLeftOpen size={18} />
          </Button>
        ) : null}
        <ProfileDropdown collapsed={collapsed} user={user} />
      </div>

      {!collapsed ? (
        <div
          className="absolute inset-y-0 right-0 z-20 w-4 translate-x-1/2 cursor-col-resize after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] after:bg-transparent hover:after:bg-carbon/10 active:after:bg-carbon/20"
          onMouseDown={handleResizeStart}
          role="separator"
          aria-label="Redimensionar barra lateral"
        />
      ) : null}
    </aside>
  );
}

function SidebarLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const Icon = item.icon;
  const link = (
    <Link
      href={item.href}
      className={cn(
        "flex min-h-10 items-center gap-3 rounded-[10px] px-3 text-sm font-bold text-carbon/70 transition-colors hover:bg-carbon/5 hover:text-carbon focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zivelo",
        active && "bg-carbon text-white shadow-[0_12px_26px_rgba(29,29,27,0.14)] hover:bg-carbon hover:text-white",
        collapsed && "justify-center px-0"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function MobileBottomNav({ pathname, user, onOpenMenu }: { pathname: string; user: UserProfile; onOpenMenu: () => void }) {
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-carbon/10 bg-paper/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-16px_40px_rgba(29,29,27,0.1)] backdrop-blur md:hidden"
      aria-label="Navegación móvil"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "grid min-h-14 place-items-center gap-1 rounded-[10px] text-[0.72rem] font-black text-carbon/60",
              active && "bg-carbon text-white"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        className="grid min-h-14 place-items-center gap-1 rounded-[10px]"
        onClick={onOpenMenu}
        aria-label="Abrir perfil"
      >
        <Avatar className="size-7 rounded-[8px]">
          <AvatarImage src={user.avatarUrl} alt="" />
          <AvatarFallback className="rounded-[8px] bg-carbon text-[0.6rem] font-black text-white">{initials}</AvatarFallback>
        </Avatar>
      </button>
    </nav>
  );
}

function MobileMenuPanel({
  open,
  user,
  onClose
}: {
  open: boolean;
  user: UserProfile;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-40 bg-paper transition-all duration-300 ease-in-out md:hidden",
        open ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Menú de navegación"
    >
      <div className="flex h-full flex-col">
        <header className="flex h-16 items-center justify-between border-b border-carbon/10 px-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-[12px] bg-zivelo text-lg font-black text-white">Z</span>
            <div>
              <p className="m-0 text-sm font-black">Zipform</p>
              <p className="m-0 text-xs font-semibold text-carbon/55">Plataforma Zivelo</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" type="button" aria-label="Cerrar menú" onClick={onClose}>
            <X size={20} />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <ProfileDropdown collapsed={false} user={user} mobile />
        </div>
      </div>
    </div>
  );
}

function ProfileDropdown({ collapsed, user, mobile = false }: { collapsed: boolean; user: UserProfile; mobile?: boolean }) {
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex min-h-12 w-full items-center gap-3 rounded-[12px] border border-transparent p-2 text-left transition-colors hover:border-carbon/10 hover:bg-carbon/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zivelo",
              collapsed && "justify-center border-0 p-0 hover:bg-transparent"
            )}
          >
            <UserAvatar user={user} initials={initials} />
            {!collapsed ? (
              <>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm">{user.username}</strong>
                  <span className="block truncate text-xs font-semibold text-carbon/55">{user.email}</span>
                </span>
                <MoreHorizontal size={18} className="shrink-0 text-carbon/55" />
              </>
            ) : null}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side={mobile ? "top" : "right"} align="end" className="w-56">
          <DropdownMenuLabel className="normal-case text-carbon">
            <div className="flex items-center gap-3">
              <UserAvatar user={user} initials={initials} large />
              <div className="min-w-0">
                <p className="m-0 truncate text-sm font-black">{user.username}</p>
                <p className="m-0 truncate text-xs normal-case text-carbon/55">{user.email}</p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings size={16} />
              Configuración
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-zivelo" onSelect={(event: Event) => event.preventDefault()}>
              <LogOut size={16} />
              Cerrar sesión
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Autenticación pendiente</AlertDialogTitle>
          <AlertDialogDescription>
            El cierre de sesión todavía es un mock visual. Cuando la autenticación esté conectada, esta acción finalizará
            la sesión compartida de Zipform.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Volver</AlertDialogCancel>
          <AlertDialogAction>Entendido</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function UserAvatar({ user, initials, large = false }: { user: UserProfile; initials: string; large?: boolean }) {
  return (
    <Avatar className={cn(large ? "size-11 rounded-[14px]" : "size-10 rounded-[12px]")}>
      <AvatarImage src={user.avatarUrl} alt="" />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action ? <div className="header-action">{action}</div> : null}
    </section>
  );
}

export function EmptyModule({
  title,
  description,
  icon
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <section className="empty-module">
      <div className="empty-icon">{icon}</div>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </section>
  );
}
