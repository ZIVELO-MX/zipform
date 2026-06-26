"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Bell, Plus, Search } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, Button, Tooltip, TooltipContent, TooltipTrigger } from "@zipform/ui";

type TlozHeaderProps = {
  title: string;
  currentView?: string;
  detailLabel?: string;
  showSearch?: boolean;
  showHeader?: boolean;
};

export function TlozHeader({ title, currentView, detailLabel, showSearch = true, showHeader = true }: TlozHeaderProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!showHeader) return null;

  const showBreadcrumbs = Boolean(detailLabel || (currentView && currentView !== "Dashboard"));

  return (
    <header
      className="tloz-main-header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "color-mix(in srgb, var(--paper) 88%, transparent)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(29,29,27,0.08)",
        padding: "12px 26px",
        display: "flex",
        alignItems: "center",
        gap: "18px",
        flexShrink: 0
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "13px", color: "#6B6B6B", fontWeight: 500, flexShrink: 0, minWidth: 0 }}>
        {showBreadcrumbs ? (
          <Breadcrumb>
            <BreadcrumbList className="text-carbon/60" style={{ fontSize: "13px", minWidth: 0 }}>
              <BreadcrumbItem style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <BreadcrumbLink asChild>
                  <Link href="/tloz" style={{ color: "#1D1D1B", fontWeight: 600 }}>Zivelo</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator style={{ flexShrink: 0 }} />
              <BreadcrumbItem style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <BreadcrumbPage style={{ color: "#1D1D1B", fontWeight: 600 }}>{currentView || title}</BreadcrumbPage>
              </BreadcrumbItem>
              {detailLabel ? (
                <>
                  <BreadcrumbSeparator style={{ flexShrink: 0 }} />
                  <BreadcrumbItem style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <BreadcrumbPage>{detailLabel}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : null}
            </BreadcrumbList>
          </Breadcrumb>
        ) : (
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <span style={{ color: "#1D1D1B", fontWeight: 600 }}>Zivelo</span>
            <span style={{ color: "#cfcfcd" }}>›</span>
            <span style={{ color: "#1D1D1B", fontWeight: 600 }}>{title}</span>
          </span>
        )}
      </div>

      {showSearch ? (
        <div style={{ flex: 1, maxWidth: "440px", margin: "0 auto", position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#9a9a98", pointerEvents: "none" }} />
          <input
            ref={searchRef}
            placeholder="Buscar missions, proyectos, quest items…"
            style={{
              width: "100%",
              height: "40px",
              padding: "0 64px 0 38px",
              borderRadius: "11px",
              border: "1px solid rgba(29,29,27,0.10)",
              background: "var(--paper)",
              fontFamily: "inherit",
              fontSize: "13.5px",
              color: "#1D1D1B",
              outline: "none"
            }}
          />
          <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", display: "flex", gap: "3px", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#9a9a98", pointerEvents: "none" }}>
            <kbd style={{ background: "#F5F5F5", border: "1px solid rgba(29,29,27,0.10)", borderRadius: "5px", padding: "1px 5px" }}>⌘</kbd>
            <kbd style={{ background: "#F5F5F5", border: "1px solid rgba(29,29,27,0.10)", borderRadius: "5px", padding: "1px 5px" }}>K</kbd>
          </span>
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>
              <button
                className="tloz-pbtn"
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "999px",
                  border: "1px solid rgba(29,29,27,0.10)",
                  background: "#fff",
                  color: "#454543",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all .2s ease",
                  position: "relative"
                }}
                disabled
              >
                <Bell size={18} />
                <span style={{ position: "absolute", top: "7px", right: "8px", width: "7px", height: "7px", borderRadius: "999px", background: "#D72228", border: "1.5px solid #fff" }} />
              </button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end">
            Pendiente: notificaciones
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>
              <Button disabled className="tloz-nbtn" style={{ height: "40px", padding: "0 16px", borderRadius: "999px", border: "none", background: "#D72228", color: "#fff", fontFamily: "inherit", fontWeight: 600, fontSize: "13.5px", display: "flex", alignItems: "center", gap: "7px", cursor: "pointer", boxShadow: "0 10px 22px rgba(215,34,40,0.20)", transition: "all .2s ease" }}>
                <Plus size={16} />
                Nueva Mission
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end">
            Pendiente: crear Missions con persistencia
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
