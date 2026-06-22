"use client";

import {
  ChevronLeft,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Settings,
  UserRound,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppModule, UserProfile } from "@zipform/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
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
import { type ComponentType, type ReactNode, useEffect, useMemo, useState } from "react";

type AppShellProps = {
  children: ReactNode;
  apps: AppModule[];
  user: UserProfile;
};

type UserRole = "admin" | "member";

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  roles?: UserRole[];
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const SIDEBAR_STATE_KEY = "dashboard-sidebar-state";
const SIDEBAR_GROUPS_KEY = "dashboard-sidebar-groups";
const DEFAULT_ROLE: UserRole = "admin";

const panelItem: NavItem = { label: "Panel", href: "/", icon: Home, roles: [DEFAULT_ROLE] };

const navGroups: NavGroup[] = [
  {
    id: "apps",
    label: "Apps",
    items: [
      { label: "Quotes", href: "/quotes", icon: FileText, roles: [DEFAULT_ROLE] },
      { label: "TLOZ", href: "/tloz", icon: Map, roles: [DEFAULT_ROLE] },
      { label: "Roadmap", href: "/roadmap", icon: ScrollText, roles: [DEFAULT_ROLE] },
      { label: "Settings", href: "/settings", icon: Settings, roles: [DEFAULT_ROLE] }
    ]
  }
];

const mobileMainItems: NavItem[] = [
  panelItem,
  { label: "Quotes", href: "/quotes", icon: FileText, roles: [DEFAULT_ROLE] },
  { label: "TLOZ", href: "/tloz", icon: Map, roles: [DEFAULT_ROLE] }
];

const mobileMenuItems: NavItem[] = [
  { label: "Roadmap", href: "/roadmap", icon: ScrollText, roles: [DEFAULT_ROLE] },
  { label: "Settings", href: "/settings", icon: Settings, roles: [DEFAULT_ROLE] }
];

const BOTTOM_NAV_HREFS = new Set(mobileMainItems.map((item) => item.href));

export function AppShell({ children, apps, user }: AppShellProps) {
  return (
    <TooltipProvider delayDuration={180}>
      <DashboardLayoutClient apps={apps} user={user}>
        {children}
      </DashboardLayoutClient>
    </TooltipProvider>
  );
}

function DashboardLayoutClient({ children, apps, user }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(() => navGroups.map((group) => group.id));

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(SIDEBAR_STATE_KEY) === "collapsed");

    const storedGroups = window.localStorage.getItem(SIDEBAR_GROUPS_KEY);
    if (storedGroups) {
      try {
        const parsed = JSON.parse(storedGroups);
        if (Array.isArray(parsed)) {
          setOpenGroups(parsed.filter((value): value is string => typeof value === "string"));
        }
      } catch {
        setOpenGroups(navGroups.map((group) => group.id));
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STATE_KEY, collapsed ? "collapsed" : "expanded");
  }, [collapsed]);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_GROUPS_KEY, JSON.stringify(openGroups));
  }, [openGroups]);

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
    const current = [...navGroups.flatMap((group) => group.items), ...mobileMenuItems].find((item) =>
      isActive(pathname, item.href)
    );
    return current?.label ?? "Zipform";
  }, [pathname]);

  return (
    <div
      className="shell min-h-dvh bg-ivory text-carbon"
      data-sidebar={collapsed ? "collapsed" : "expanded"}
    >
      <DesktopSidebar
        apps={apps}
        collapsed={collapsed}
        openGroups={openGroups}
        pathname={pathname}
        user={user}
        onGroupsChange={setOpenGroups}
        onToggleCollapsed={() => setCollapsed((current) => !current)}
      />

      <main className="main-surface min-w-0">{children}</main>

      <MobileBottomNav pathname={pathname} onOpenMenu={() => setMobileMenuOpen(true)} />
      <MobileMenuPanel
        apps={apps}
        open={mobileMenuOpen}
        pathname={pathname}
        user={user}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="fixed inset-x-0 top-0 z-20 flex h-12 items-center border-b border-carbon/10 bg-paper/90 backdrop-blur md:hidden">
        <button
          type="button"
          className="grid size-12 shrink-0 place-items-center text-carbon/70"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
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
  apps,
  collapsed,
  openGroups,
  pathname,
  user,
  onGroupsChange,
  onToggleCollapsed
}: {
  apps: AppModule[];
  collapsed: boolean;
  openGroups: string[];
  pathname: string;
  user: UserProfile;
  onGroupsChange: (groups: string[]) => void;
  onToggleCollapsed: () => void;
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh border-r border-carbon/10 bg-paper md:flex md:flex-col" aria-label="Main navigation">
      <div className="flex h-16 items-center gap-2 border-b border-carbon/10 px-3">
        <Link
          href="/"
          className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-zivelo text-lg font-black text-white shadow-[0_12px_24px_rgba(215,34,40,0.25)]"
          aria-label="Zipform home"
        >
          Z
        </Link>
        <div className={cn("min-w-0 flex-1", collapsed && "hidden")}>
          <p className="m-0 truncate text-sm font-black">Zipform</p>
          <p className="m-0 truncate text-xs font-semibold text-carbon/55">Zivelo platform</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className={cn("shrink-0", collapsed && "hidden")}
          aria-label="Collapse sidebar"
          title="Cmd+B"
          onClick={onToggleCollapsed}
        >
          <PanelLeftClose size={18} />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-2 py-3">
        <nav className="grid gap-1" aria-label="Primary">
          <SidebarLink item={panelItem} active={isActive(pathname, panelItem.href)} collapsed={collapsed} />
        </nav>

        <Separator />

        <Accordion type="multiple" value={openGroups} onValueChange={onGroupsChange} className={cn(collapsed && "hidden")}>
          {navGroups.map((group) => (
            <AccordionItem key={group.id} value={group.id} className="border-0">
              <AccordionTrigger className="px-2 py-2 text-xs uppercase text-zivelo">{group.label}</AccordionTrigger>
              <AccordionContent className="grid gap-1 pb-0">
                {group.items.map((item) => (
                  <SidebarLink key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={false} />
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <nav className={cn("grid gap-1", !collapsed && "hidden")} aria-label="Applications">
          {navGroups.flatMap((group) => group.items).map((item) => (
            <SidebarLink key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={collapsed} />
          ))}
        </nav>

        {!collapsed ? <AppStatusList apps={apps} /> : null}
      </div>

      <div className="border-t border-carbon/10 p-2">
        {collapsed ? (
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Expand sidebar"
            title="Cmd+B"
            onClick={onToggleCollapsed}
            className="mb-2"
          >
            <PanelLeftOpen size={18} />
          </Button>
        ) : null}
        <ProfileDropdown collapsed={collapsed} user={user} />
      </div>
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

function AppStatusList({ apps }: { apps: AppModule[] }) {
  return (
    <section className="mt-auto grid gap-2 rounded-[12px] border border-carbon/10 bg-ivory/70 p-2" aria-label="Application status">
      <p className="m-0 px-1 text-xs font-black uppercase text-zivelo">Status</p>
      {apps.slice(0, 4).map((app) => (
        <Link key={app.id} href={app.href} className="flex min-h-8 items-center gap-2 rounded-[8px] px-2 text-xs font-bold hover:bg-paper">
          <span className={cn("size-2 rounded-full bg-stonewarm", app.status === "enabled" && "bg-emerald-500", app.status === "external" && "bg-zivelo")} />
          <span className="truncate">{app.shortName}</span>
        </Link>
      ))}
    </section>
  );
}

function MobileBottomNav({ pathname, onOpenMenu }: { pathname: string; onOpenMenu: () => void }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-carbon/10 bg-paper/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-16px_40px_rgba(29,29,27,0.1)] backdrop-blur md:hidden"
      aria-label="Mobile navigation"
    >
      {mobileMainItems.map((item) => {
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
        className={cn(
          "grid min-h-14 place-items-center gap-1 rounded-[10px] text-[0.72rem] font-black text-carbon/60",
          !BOTTOM_NAV_HREFS.has(pathname) && pathname !== "/" && "bg-carbon text-white"
        )}
        onClick={onOpenMenu}
      >
        <Menu size={20} />
        <span>Menu</span>
      </button>
    </nav>
  );
}

function MobileMenuPanel({
  apps,
  open,
  pathname,
  user,
  onClose
}: {
  apps: AppModule[];
  open: boolean;
  pathname: string;
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
      aria-label="Navigation menu"
    >
      <div className="flex h-full flex-col">
        <header className="flex h-16 items-center justify-between border-b border-carbon/10 px-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-[12px] bg-zivelo text-lg font-black text-white">Z</span>
            <div>
              <p className="m-0 text-sm font-black">Zipform</p>
              <p className="m-0 text-xs font-semibold text-carbon/55">Zivelo platform</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" type="button" aria-label="Close menu" onClick={onClose}>
            <X size={20} />
          </Button>
        </header>

        <div className="grid flex-1 content-start gap-5 overflow-y-auto px-4 py-5">
          <nav className="grid gap-2" aria-label="Menu">
            {mobileMenuItems.map((item) => (
              <MobileMenuLink key={item.href} item={item} active={isActive(pathname, item.href)} />
            ))}
          </nav>

          <AppStatusList apps={apps} />
        </div>

        <div className="border-t border-carbon/10 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <ProfileDropdown collapsed={false} user={user} mobile />
        </div>
      </div>
    </div>
  );
}

function MobileMenuLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex min-h-12 items-center gap-3 rounded-[12px] border border-carbon/10 px-3 text-sm font-black",
        active ? "bg-carbon text-white" : "bg-ivory/80"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon size={19} />
      {item.label}
    </Link>
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
              "flex min-h-12 w-full items-center gap-3 rounded-[12px] border border-carbon/10 bg-ivory/70 p-2 text-left transition-colors hover:bg-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zivelo",
              collapsed && "justify-center border-0 bg-transparent p-0",
              mobile && "bg-ivory"
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
              <UserRound size={16} />
              Perfil / Configuracion
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/roadmap">
              <ScrollText size={16} />
              Roadmap
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-zivelo" onSelect={(event: Event) => event.preventDefault()}>
              <LogOut size={16} />
              Cerrar Sesion
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Auth real pendiente</AlertDialogTitle>
          <AlertDialogDescription>
            El cierre de sesion todavia es un mock visual. Cuando la autenticacion este conectada, esta accion terminara
            la sesion compartida de Zipform.
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
      <Link href="/roadmap" className="button-link">
        View roadmap
        <ChevronLeft size={16} className="rotate-180" />
      </Link>
    </section>
  );
}
