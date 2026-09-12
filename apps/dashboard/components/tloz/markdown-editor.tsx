"use client";

import { Children, isValidElement, useEffect, useId, useRef, useState } from "react";
import { ClipboardCopy, Edit3, MoreHorizontal } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button, cn, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, toast } from "@tloz/ui";
import { MermaidDiagram } from "./mermaid-diagram";
import { isMermaidCodeBlock } from "./mermaid-utils";

type MarkdownEditorProps = {
  value: string;
  onSave: (value: string) => void | boolean | Promise<void | boolean>;
  onToggleTask?: (position: number, completed: boolean) => void;
  placeholder?: string;
  showHeader?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
};

export function MarkdownEditor({ value, onSave, onToggleTask, placeholder = "Añadir detalle con Markdown…", showHeader = true, readOnly = false, disabled = false }: MarkdownEditorProps) {
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef<"editor" | "trigger" | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorId = useId();
  const persistedValue = useRef(value);

  useEffect(() => {
    if (value === persistedValue.current) return;
    const keepDraft = editing && draft !== persistedValue.current && draft !== value;
    persistedValue.current = value;
    if (!keepDraft) {
      setDraft(value);
      setEditing(false);
    }
  }, [value, draft, editing]);

  useEffect(() => {
    if (saving || disabled || !restoreFocus.current) return;
    const target = restoreFocus.current === "editor" ? textareaRef.current : triggerRef.current;
    if (!target) return;
    target.focus();
    restoreFocus.current = null;
  }, [saving, disabled, editing]);

  function cancel() {
    if (saving || disabled) return;
    setDraft(value);
    setSaveError("");
    restoreFocus.current = "trigger";
    setEditing(false);
  }

  async function save() {
    if (saving || disabled) return;
    if (draft === value) { cancel(); return; }
    setSaveError("");
    setSaving(true);
    try {
      const saved = await onSave(draft);
      if (saved !== false) {
        restoreFocus.current = "trigger";
        setEditing(false);
      } else {
        setSaveError("No se pudo guardar. Tu texto sigue aquí; intenta de nuevo.");
        restoreFocus.current = "editor";
      }
    } catch {
      setSaveError("No se pudo guardar. Tu texto sigue aquí; intenta de nuevo.");
      restoreFocus.current = "editor";
      toast.error("No se pudo guardar el detalle");
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(editing ? draft : value);
      toast.success("Copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar el detalle");
    }
  }

  return (
    <section className={showHeader ? "mb-7" : ""} aria-label={showHeader ? undefined : "Editor de detalle"}>
      {value || editing ? <div className={cn("mb-2 flex items-center", showHeader ? "justify-between" : "justify-end")}>
        {showHeader ? <h2 className="text-[13px] font-bold uppercase tracking-[0.04em] text-carbon/75">Detalle</h2> : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button ref={triggerRef} type="button" variant="ghost" size="icon-xs" className="size-7 rounded-md text-carbon/45 hover:text-carbon" aria-label="Opciones de descripción">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40" onCloseAutoFocus={(event) => { if (textareaRef.current) { event.preventDefault(); textareaRef.current.focus(); } }}>
            <DropdownMenuItem onSelect={handleCopy}>
              <ClipboardCopy className="size-3.5" />
              Copiar
            </DropdownMenuItem>
            {!editing && !readOnly ? (
              <DropdownMenuItem disabled={disabled} onSelect={() => setEditing(true)}>
                <Edit3 className="size-3.5" />
                Editar
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div> : null}

      {editing ? (
        <div className="flex flex-col gap-2">
            <label className="sr-only" htmlFor={editorId}>Detalle en Markdown</label>
            <textarea
              disabled={saving || disabled}
              id={editorId}
              aria-invalid={Boolean(saveError)}
              aria-describedby={saveError ? `${editorId}-error` : undefined}
              ref={textareaRef}
              style={{ outlineOffset: -3 }}
              autoFocus
              className="min-h-[45dvh] w-full resize-y rounded-xl border border-carbon/15 bg-paper px-3 py-2 font-mono text-[0.8125rem] leading-relaxed text-carbon/80 outline-none focus-visible:border-carbon/30 focus-visible:ring-2 focus-visible:ring-carbon/10 md:min-h-80"
              value={draft}
              placeholder={placeholder}
              onChange={(event) => { setDraft(event.target.value); setSaveError(""); }}
              onKeyDown={(event) => {
                if (event.key === "Escape" && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  event.stopPropagation();
                  cancel();
                }
              }}
            />
          {saveError ? <p id={`${editorId}-error`} role="alert" className="m-0 text-xs font-semibold text-zivelo">{saveError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={cancel} disabled={saving || disabled}>Cancelar</Button>
            <Button type="button" onClick={() => void save()} disabled={saving || disabled}>{saving ? "Guardando…" : "Guardar"}</Button>
          </div>
        </div>
      ) : (
        value ? <div className="w-full rounded-lg bg-[var(--surface-subtle)] px-3 py-2 text-[14px] [overflow-wrap:anywhere] leading-relaxed text-carbon/80 transition-colors hover:border-carbon/15 hover:bg-paper"><MarkdownContent onToggleTask={onToggleTask}>{value}</MarkdownContent></div>
          : !readOnly ? <button ref={triggerRef} type="button" disabled={disabled} className="min-h-8 rounded-md px-1 py-1 text-left text-[13px] font-semibold text-carbon/65 hover:bg-carbon/5 hover:text-carbon focus-visible:outline focus-visible:outline-2 focus-visible:outline-carbon/30" aria-label="Añadir detalle" onClick={() => setEditing(true)}>Añadir detalle…</button> : <span className="text-[13.5px] text-carbon/45">{placeholder}</span>
      )}
    </section>
  );
}

export function MarkdownContent({ children, onToggleTask }: { children: string; onToggleTask?: (position: number, completed: boolean) => void }) {
  let taskPosition = 0;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        ul: ({ className, ...props }) => <ul className="mb-3 list-disc pl-5 last:mb-0" {...props} />,
        ol: ({ className, ...props }) => <ol className="mb-3 list-decimal pl-5 last:mb-0" {...props} />,
        li: ({ className, children, ...props }) => {
          const liChildren = Array.isArray(children) ? children : [children];
          const first = liChildren[0];
          if (typeof first === "object" && first && "type" in first && (first as { type: string }).type === "input") {
            const input = first as { props: { checked?: boolean; disabled?: boolean } };
            const checked = input.props?.checked ?? false;
            const position = taskPosition++;
            const rest = liChildren.slice(1);
            return (
              <li className="mb-1 flex items-start gap-2 last:mb-0" {...props}>
                <input type="checkbox" checked={checked} disabled={!onToggleTask} onChange={(event) => onToggleTask?.(position, event.target.checked)} aria-label={`Task ${position + 1}`} className="mt-0.5 size-[17px] shrink-0 cursor-pointer accent-[#D72228] disabled:cursor-default" />
                <span className="min-w-0 flex-1 text-[14px] leading-relaxed">{rest}</span>
              </li>
            );
          }
          return <li className="mb-1 last:mb-0" {...props}>{children}</li>;
        },
        p: ({ className, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
        strong: ({ ...props }) => <strong className="font-semibold text-carbon" {...props} />,
        code: ({ className, ...props }) => {
          const isInline = !className;
          if (isInline) return <code className="rounded bg-carbon/5 px-1 py-0.5 font-mono text-[13px] text-[#B91C22]" {...props} />;
          if (isMermaidCodeBlock(className)) return <MermaidDiagram source={String(props.children).replace(/\n$/, "")} />;
          return <code className={`${className ?? ""} break-words`} {...props} />;
        },
        pre: ({ children }) => {
          const code = Children.toArray(children)[0];
          if (isValidElement<{ className?: string }>(code) && isMermaidCodeBlock(code.props.className)) return <>{children}</>;
          return <pre className="mb-3 max-w-full overflow-x-auto rounded-lg bg-carbon/5 p-3 text-[13px] last:mb-0 [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-inherit" tabIndex={0}>{children}</pre>;
        },
        table: ({ ...props }) => <div className="mb-3 max-w-full overflow-x-auto rounded-lg border border-carbon/10" tabIndex={0}><table className="w-full border-collapse text-left text-[13px]" {...props} /></div>,
        th: ({ ...props }) => <th className="border-b border-carbon/10 bg-carbon/5 px-3 py-2 font-semibold" {...props} />,
        td: ({ ...props }) => <td className="border-b border-carbon/10 px-3 py-2 align-top" {...props} />,
        a: ({ ...props }) => <a className="break-words text-zivelo underline underline-offset-2 hover:text-zivelo/80" target="_blank" rel="noreferrer" {...props} />,
        h1: ({ ...props }) => <h1 className="mb-3 text-2xl font-bold last:mb-0" {...props} />,
        h2: ({ ...props }) => <h2 className="mb-2 text-xl font-bold last:mb-0" {...props} />,
        h3: ({ ...props }) => <h3 className="mb-2 text-lg font-semibold last:mb-0" {...props} />,
        blockquote: ({ ...props }) => <blockquote className="mb-3 border-l border-carbon/20 pl-3 text-carbon/65 italic last:mb-0" {...props} />,
        hr: ({ ...props }) => <hr className="mb-3 border-carbon/10 last:mb-0" {...props} />,
      }}
    >
      {children || ""}
    </ReactMarkdown>
  );
}
