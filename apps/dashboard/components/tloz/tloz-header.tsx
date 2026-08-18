"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import {
  Menu,
  Search,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@tloz/ui";
import { TlozControl } from "./tloz-control";
import { GlobalSearch } from "./global-search";

type TlozHeaderProps = {
  title: string;
  projectLabel?: string;
  detailLabel?: string;
  breadcrumb?: Array<string | { label: string; href: string }>;
  showSearch?: boolean;
  showHeader?: boolean;
  showControls?: boolean;
  controlCreate?: React.ReactNode | false;
};
export function TlozHeader({ title, projectLabel, detailLabel, breadcrumb, showSearch = true, showHeader = true, showControls = true, controlCreate }: TlozHeaderProps) {
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    if (!showSearch) return;
    function handleOpen() { setCommandOpen(true); }
    window.addEventListener("open-command", handleOpen);

    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("open-command", handleOpen);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showSearch]);

  if (!showHeader) return null;

  const segments = breadcrumb ?? [projectLabel, detailLabel].filter((value): value is string => Boolean(value));

  return (
    <>
      <header className="tloz-main-header">
        <div className="tloz-header-leading">
          <button
            type="button"
            className="mr-1 grid size-8 shrink-0 place-items-center rounded-lg text-carbon/60 hover:bg-carbon/5 md:hidden"
            aria-label="Abrir menú"
            onClick={() => window.dispatchEvent(new CustomEvent("toggle-mobile-menu"))}
          >
            <Menu size={18} aria-hidden="true" />
          </button>
          {showSearch ? <button
            type="button"
            className="mr-1 grid size-8 shrink-0 place-items-center rounded-lg text-carbon/60 hover:bg-carbon/5 md:hidden"
            aria-label="Buscar documentos"
            onClick={() => setCommandOpen(true)}
          >
            <Search size={17} aria-hidden="true" />
          </button> : null}
          {segments.length ? (
            <Breadcrumb>
              <BreadcrumbList className="flex-nowrap text-carbon/60">
                {segments.map((segment, index) => {
                  const label = typeof segment === "string" ? segment : segment.label;
                  return <Fragment key={`${label}-${index}`}>
                    {index > 0 ? <BreadcrumbSeparator /> : null}
                    <BreadcrumbItem className="min-w-0">
                      {typeof segment === "string" ? <BreadcrumbPage className="truncate">{label}</BreadcrumbPage> : <BreadcrumbLink asChild><Link className="truncate" href={segment.href}>{label}</Link></BreadcrumbLink>}
                    </BreadcrumbItem>
                  </Fragment>;
                })}
              </BreadcrumbList>
            </Breadcrumb>
          ) : null}
        </div>

        {showSearch ? <div className="hidden md:flex flex-1 justify-center">
          <button
            type="button"
            className="tloz-command-trigger"
            onClick={() => setCommandOpen(true)}
          >
            <Search size={14} aria-hidden="true" />
            <span>Buscar documentos, misiones o recursos...</span>
            <kbd>⌘K</kbd>
          </button>
        </div> : null}

        {showControls ? <div className="tloz-header-trailing"><TlozControl createControl={controlCreate} /></div> : null}
      </header>

      <GlobalSearch open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
