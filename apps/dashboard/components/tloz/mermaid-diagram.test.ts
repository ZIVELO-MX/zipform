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

  it("opens a contained full-screen viewer with SVG download", () => {
    const source = readFileSync(new URL("./mermaid-diagram.tsx", import.meta.url), "utf8");
    const previewSource = readFileSync(new URL("../../../../packages/ui/src/components/resource-preview.tsx", import.meta.url), "utf8");
    const lightboxSource = readFileSync(new URL("../../../../packages/ui/src/components/resource-preview-lightbox.tsx", import.meta.url), "utf8");
    expect(source).toContain('aria-label="Abrir diagrama Mermaid"');
    expect(source).toContain("ResourcePreview");
    expect(source).toContain("createMermaidSvgBlob(svg)");
    expect(source).toContain('aria-label="Descargar diagrama SVG"');
    expect(source).toContain("downloadMermaidSvg");
    expect(source).toContain('anchor.download = "diagrama-mermaid.svg"');
    expect(source).toContain("URL.revokeObjectURL(url)");
    expect(source).toContain("triggerRef");
    expect(previewSource).toContain("React.lazy");
    expect(lightboxSource).toContain("Zoom");
    expect(lightboxSource).toContain("Thumbnails");
    expect(lightboxSource).toContain("Fullscreen");
    expect(source).not.toContain("onWheel={handleWheel}");
    expect(source).not.toContain("setPointerCapture");
    expect(source).not.toContain("mermaid-viewport");
  });
});
