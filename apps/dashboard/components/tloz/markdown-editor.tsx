"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ClipboardCopy, Edit3, MoreHorizontal } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, SegmentedControl, toast } from "@zipform/ui";

type MarkdownEditorProps = {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
};

export function MarkdownEditor({ value, onSave, placeholder = "Añadir descripción detallada con Markdown…" }: MarkdownEditorProps) {
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<"visual" | "text">("visual");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const skipSave = useRef(false);

  useEffect(() => {
    setDraft(value);
    setEditing(false);
    setMode("visual");
  }, [value]);

  function finish() {
    if (skipSave.current) {
      skipSave.current = false;
      setDraft(value);
      setEditing(false);
      return;
    }
    if (draft !== value) onSave(draft);
    setEditing(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => toast.success("Copiado al portapapeles"));
  }

  return (
    <section className="mb-7">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.04em] text-carbon/75">Descripción</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon-xs" className="size-7 rounded-md text-carbon/45 hover:text-carbon" aria-label="Opciones de descripción">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onSelect={handleCopy}>
              <ClipboardCopy className="size-3.5" />
              Copiar
            </DropdownMenuItem>
            {!editing ? (
              <DropdownMenuItem onSelect={() => setEditing(true)}>
                <Edit3 className="size-3.5" />
                Editar
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {editing ? (
        <div className="space-y-2">
          <SegmentedControl
            aria-label="Modo de edición"
            value={mode}
            onValueChange={(v) => setMode(v as "visual" | "text")}
            options={[
              { label: "Visual", value: "visual" },
              { label: "Text", value: "text" },
            ]}
          />
          {mode === "text" ? (
            <textarea
              ref={textareaRef}
              autoFocus
              className="min-h-28 w-full resize-y rounded-xl border border-[#1D1D1B]/15 bg-white px-3 py-2 font-mono text-[13px] leading-[1.6] text-[#454543] outline-none focus:border-[#1D1D1B]/25 focus:ring-2 focus:ring-[#1D1D1B]/10"
              value={draft}
              placeholder={placeholder}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={finish}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  skipSave.current = true;
                  setDraft(value);
                  setEditing(false);
                }
              }}
            />
          ) : (
            <div
              className="min-h-28 w-full cursor-text rounded-xl border border-[#1D1D1B]/15 bg-white px-3 py-2 text-[15px] leading-[1.6] text-[#454543]"
              onClick={() => textareaRef.current?.focus()}
            >
              <MarkdownContent>{draft}</MarkdownContent>
            </div>
          )}
        </div>
      ) : (
        <div
          className="min-h-24 w-full cursor-pointer rounded-xl border border-transparent bg-[#FAF9F7] px-4 py-3 text-[15px] leading-[1.6] text-[#454543] transition-colors hover:border-carbon/15 hover:bg-white"
          role="button"
          tabIndex={0}
          onClick={() => setEditing(true)}
          onKeyDown={(event) => { if (event.key === "Enter") setEditing(true); }}
        >
          {value ? <MarkdownContent>{value}</MarkdownContent> : <span className="text-carbon/45">{placeholder}</span>}
        </div>
      )}
    </section>
  );
}

function MarkdownContent({ children }: { children: string }) {
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
            const rest = liChildren.slice(1);
            return (
              <li className="mb-1 flex items-start gap-2 last:mb-0" {...props}>
                <span className="mt-0.5 grid size-[17px] shrink-0 place-items-center rounded-[5px] border-2 border-carbon/25 bg-white">
                  {checked ? <Check className="size-3 text-carbon/60" strokeWidth={3} /> : null}
                </span>
                <span className="min-w-0 flex-1 text-[15px] leading-[1.6]">{rest}</span>
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
          return <pre className="mb-3 overflow-x-auto rounded-xl bg-[#F5F5F4] p-4 text-[13px] last:mb-0"><code {...props} /></pre>;
        },
        a: ({ ...props }) => <a className="text-zivelo underline underline-offset-2 hover:text-zivelo/80" target="_blank" rel="noreferrer" {...props} />,
        h1: ({ ...props }) => <h1 className="mb-3 text-2xl font-bold last:mb-0" {...props} />,
        h2: ({ ...props }) => <h2 className="mb-2 text-xl font-bold last:mb-0" {...props} />,
        h3: ({ ...props }) => <h3 className="mb-2 text-lg font-semibold last:mb-0" {...props} />,
        blockquote: ({ ...props }) => <blockquote className="mb-3 border-l-4 border-carbon/15 pl-4 text-carbon/65 italic last:mb-0" {...props} />,
        hr: ({ ...props }) => <hr className="mb-3 border-carbon/10 last:mb-0" {...props} />,
      }}
    >
      {children || ""}
    </ReactMarkdown>
  );
}
