"use client";

import Link from "next/link";
import {
  LogOut,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  X
} from "lucide-react";
import { type ComponentType, useCallback } from "react";

export type SidebarUser = {
  name: string;
  username: string;
  email: string;
  avatarUrl: string;
};
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
} from "./alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { cn } from "../lib/utils";

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string; size?: number }>;
};

export type NavSection = {
  label?: string;
  items: NavItem[];
};

export const SIDEBAR_MIN_WIDTH = 220;
export const SIDEBAR_MAX_WIDTH = 500;
export const SIDEBAR_DEFAULT_WIDTH = 284;

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopSidebar({
  collapsed,
  pathname,
  user,
  items,
  sections,
  contextItem,
  sidebarWidth,
  onResize,
  onToggleCollapsed
}: {
  collapsed: boolean;
  pathname: string;
  user: SidebarUser;
  items: NavItem[];
  sections?: NavSection[];
  contextItem?: NavItem;
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
        <div className={cn("min-w-0 flex-1 transition-opacity duration-200", collapsed && "pointer-events-none opacity-0")}>
          <p className="m-0 truncate text-sm font-semibold">Zipform</p>
          <p className="m-0 truncate text-xs font-normal text-carbon/55">Plataforma Zivelo</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className={cn("shrink-0 transition-all duration-200", collapsed && "pointer-events-none scale-0 opacity-0")}
          aria-label="Contraer barra"
          title="Cmd+B"
          onClick={onToggleCollapsed}
        >
          <PanelLeftClose size={18} />
        </Button>
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 py-3"
      >
        <nav className="grid gap-4" aria-label="Principal">
          {contextItem ? (
            <div className="grid gap-2 border-b border-carbon/10 pb-3">
              <SidebarLink item={contextItem} active={false} collapsed={collapsed} subtle />
            </div>
          ) : null}
          {(sections ?? [{ items }]).map((section, sectionIndex) => (
            <div className="grid gap-1" key={section.label ?? sectionIndex}>
              {section.label && !collapsed ? (
                <p className="m-0 px-3 pb-1 text-[0.68rem] font-medium uppercase tracking-0 text-carbon/40">
                  {section.label}
                </p>
              ) : null}
              {section.items.map((item) => (
                <SidebarLink key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={collapsed} />
              ))}
            </div>
          ))}
        </nav>
      </div>

      <div className={cn(
        "border-t border-carbon/10",
        collapsed
          ? "flex flex-col items-center gap-2 border-transparent px-0 py-3"
          : "p-2"
      )}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                aria-label="Expandir barra"
                onClick={onToggleCollapsed}
              >
                <PanelLeftOpen size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Expandir barra</TooltipContent>
          </Tooltip>
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

export function SidebarLink({
  item,
  active,
  collapsed,
  subtle = false
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  subtle?: boolean;
}) {
  const Icon = item.icon;
  const link = (
    <Link
      href={item.href}
      className={cn(
        "flex min-h-10 items-center gap-3 rounded-[10px] px-3 text-sm font-medium text-carbon/70 transition-colors hover:bg-carbon/5 hover:text-carbon focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zivelo",
        subtle && "text-carbon/55",
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

export function MobileBottomNav({
  pathname,
  user,
  items,
  onOpenMenu
}: {
  pathname: string;
  user: SidebarUser;
  items: NavItem[];
  onOpenMenu: () => void;
}) {
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
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "grid min-h-14 place-items-center gap-1 rounded-[10px] text-[0.72rem] font-medium text-carbon/60",
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
        <Avatar className="size-7 rounded-full">
          <AvatarImage src={user.avatarUrl} alt="" />
          <AvatarFallback className="rounded-full bg-carbon text-[0.6rem] font-medium text-white">{initials}</AvatarFallback>
        </Avatar>
      </button>
    </nav>
  );
}

export function MobileMenuPanel({
  open,
  pathname,
  user,
  items,
  sections,
  contextItem,
  onClose
}: {
  open: boolean;
  pathname: string;
  user: SidebarUser;
  items: NavItem[];
  sections?: NavSection[];
  contextItem?: NavItem;
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
              <p className="m-0 text-sm font-semibold">Zipform</p>
              <p className="m-0 text-xs font-normal text-carbon/55">Plataforma Zivelo</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" type="button" aria-label="Cerrar menú" onClick={onClose}>
            <X size={20} />
          </Button>
        </header>

        <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="Navegación">
          {contextItem ? <MobileNavLink item={contextItem} active={false} onClose={onClose} subtle /> : null}
          {(sections ?? [{ items }]).map((section, sectionIndex) => (
            <div className="mt-4 grid gap-1" key={section.label ?? sectionIndex}>
              {section.label ? (
                <p className="m-0 px-3 pb-1 text-[0.68rem] font-medium uppercase tracking-0 text-carbon/40">
                  {section.label}
                </p>
              ) : null}
              {section.items.map((item) => (
                <MobileNavLink key={item.href} item={item} active={isActive(pathname, item.href)} onClose={onClose} />
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-carbon/10 px-4 py-4">
          <ProfileDropdown collapsed={false} user={user} mobile />
        </div>
      </div>
    </div>
  );
}

function MobileNavLink({
  item,
  active,
  onClose,
  subtle = false
}: {
  item: NavItem;
  active: boolean;
  onClose: () => void;
  subtle?: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        "flex min-h-12 items-center gap-3 rounded-[12px] px-3 text-sm font-medium text-carbon/70 transition-colors hover:bg-carbon/5 hover:text-carbon",
        subtle && "text-carbon/55",
        active && "bg-carbon text-white hover:bg-carbon hover:text-white"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon size={20} className="shrink-0" />
      {item.label}
    </Link>
  );
}

export function ProfileDropdown({ collapsed, user, mobile = false }: { collapsed: boolean; user: SidebarUser; mobile?: boolean }) {
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
                  <span className="block truncate text-[0.7rem] font-normal text-carbon/55">{user.email}</span>
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
                <span className="block truncate text-sm font-semibold">{user.username}</span>
                <span className="block truncate text-[0.7rem] font-normal text-carbon/55">{user.email}</span>
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

export function UserAvatar({ user, initials, large = false }: { user: SidebarUser; initials: string; large?: boolean }) {
  return (
    <Avatar className={cn(large ? "size-11 rounded-full" : "size-10 rounded-full")}>
      <AvatarImage src={user.avatarUrl} alt="" />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}
