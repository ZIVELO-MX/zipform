import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isMermaidCodeBlock } from "./mermaid-utils";

describe("Mermaid Markdown diagrams", () => {
  it("recognizes only Mermaid fenced code blocks", () => {
    expect(isMermaidCodeBlock("language-mermaid")).toBe(true);
    expect(isMermaidCodeBlock("language-typescript")).toBe(false);
    expect(isMermaidCodeBlock()).toBe(false);
  });

  it("loads Mermaid on demand with strict rendering and a readable fallback", () => {
    const source = readFileSync(new URL("./mermaid-diagram.tsx", import.meta.url), "utf8");
    const markdownSource = readFileSync(new URL("./markdown-editor.tsx", import.meta.url), "utf8");
    expect(source).toContain('import("mermaid")');
    expect(source).toContain('securityLevel: "strict"');
    expect(source).toContain("Diagrama Mermaid inválido");
    expect(source).toContain("<code>{source}</code>");
    expect(markdownSource).toContain("if (isMermaidCodeBlock(className))");
    expect(markdownSource).toContain('<code className={className} {...props} />');
  });

  it("opens an accessible modal viewer with wheel zoom and drag", () => {
    const source = readFileSync(new URL("./mermaid-diagram.tsx", import.meta.url), "utf8");
    const dialogSource = readFileSync(new URL("../../../../packages/ui/src/components/dialog.tsx", import.meta.url), "utf8");
    expect(source).toContain('aria-label="Abrir diagrama Mermaid"');
    expect(source).toContain('title="Visor de diagrama Mermaid"');
    expect(source).not.toContain("event.ctrlKey");
    expect(source).not.toContain("event.metaKey");
    expect(source).toContain("setPointerCapture");
    expect(source).toContain('aria-label="Cerrar visor de diagrama"');
    expect(source).toContain("onPointerDownOutside={(event) => event.preventDefault()}");
    expect(source).toContain('overlayVariant="mission"');
    expect(source).toContain('aria-label="Reducir diagrama"');
    expect(source).toContain('aria-label="Ampliar diagrama"');
    expect(source).toContain("disabled={zoom <= MIN_MERMAID_ZOOM}");
    expect(source).toContain("disabled={zoom >= MAX_MERMAID_ZOOM}");
    expect(source).toContain("cursor-pointer");
    expect(source).toContain("select-none");
    expect(source).not.toContain("Maximize2");
    expect(source).not.toContain("will-change-transform");
    expect(source).not.toContain("diagram.style.width");
    expect(dialogSource).toContain('type DialogOverlayVariant = "dimmed" | "mission"');
    expect(dialogSource).toContain('variant === "mission" ? "bg-carbon/60" : "bg-carbon/40 backdrop-blur-sm"');
  });
});
