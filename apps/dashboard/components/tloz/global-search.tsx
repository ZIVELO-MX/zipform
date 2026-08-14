"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FolderKanban, PackageOpen, Search, Sword, FileText, ExternalLink } from "lucide-react";
import { Command, CommandDialog } from "@tloz/ui";
import type { GlobalSearchResult } from "../../lib/global-search";

const actions = [
  { label: "Abrir Inventory", href: "/inventory", icon: PackageOpen, keywords: "inventory inventario items" },
  { label: "Abrir Projects", href: "/projects", icon: FolderKanban, keywords: "proyectos projects" },
  { label: "Abrir Workshop", href: "/workshop", icon: Sword, keywords: "workshop ideas" },
  { label: "Abrir Library", href: "/library", icon: FolderKanban, keywords: "library biblioteca documentos" },
  { label: "Abrir Lobby", href: "/", icon: Sword, keywords: "lobby missions misiones" },
];

type GlobalSearchProps = { open: boolean; onOpenChange: (open: boolean) => void };

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) {
      requestRef.current?.abort();
      setQuery("");
      setResults([]);
      setError(false);
      setLoading(false);
      return;
    }
    return () => requestRef.current?.abort();
  }, [open]);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      requestRef.current?.abort();
      setResults([]);
      setError(false);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    requestRef.current?.abort();
    requestRef.current = controller;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(`/api/v1/search?q=${encodeURIComponent(normalized)}&limit=20`, { signal: controller.signal });
        if (!response.ok) throw new Error("search_failed");
        const payload = await response.json() as { data?: GlobalSearchResult[] };
        if (!controller.signal.aborted) setResults(payload.data ?? []);
      } catch (searchError) {
        if (!controller.signal.aborted) {
          setResults([]);
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [query]);

  function navigate(destination: string) {
    onOpenChange(false);
    router.push(destination);
  }

  return (
    <CommandDialog className="tloz-command-dialog" label="Buscar y navegar en TLOZ" open={open} onOpenChange={onOpenChange}>
      <div className="tloz-command-input-wrap">
        <Search aria-hidden="true" />
        <Command.Input
          autoFocus
          value={query}
          onValueChange={setQuery}
          placeholder="Buscar documentos, misiones o recursos..."
          aria-label="Buscar documentos, misiones o recursos"
        />
      </div>
      <Command.List>
        {query.trim().length < 2 ? (
          <Command.Group heading="Navegación rápida">
            {actions.map((action) => {
              const Icon = action.icon;
              return <Command.Item key={action.href} keywords={[action.keywords]} value={action.label} onSelect={() => navigate(action.href)}><Icon aria-hidden="true" /><span>{action.label}</span></Command.Item>;
            })}
          </Command.Group>
        ) : loading ? (
          <Command.Loading>Cargando resultados...</Command.Loading>
        ) : error ? (
          <Command.Empty role="alert">No se pudo completar la búsqueda. Intenta de nuevo.</Command.Empty>
        ) : results.length === 0 ? (
          <Command.Empty>No se encontraron documentos.</Command.Empty>
        ) : (
          <Command.Group heading="Resultados">
            {results.map((result) => <Command.Item key={`${result.type}-${result.id}`} value={`${result.title} ${result.context}`} onSelect={() => navigate(result.destination)}>
              {result.type === "resource" ? <FileText aria-hidden="true" /> : result.type === "inventory" ? <PackageOpen aria-hidden="true" /> : result.type === "mission" ? <Sword aria-hidden="true" /> : <FolderKanban aria-hidden="true" />}
              <span className="min-w-0 flex-1 truncate">{result.title}<span className="ml-2 text-[11px] opacity-60">{result.context}</span></span>
              <ExternalLink className="opacity-40" aria-hidden="true" />
            </Command.Item>)}
          </Command.Group>
        )}
      </Command.List>
      <p className="sr-only" aria-live="polite">{loading ? "Buscando" : `${results.length} resultados`}</p>
    </CommandDialog>
  );
}
