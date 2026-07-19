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

  it("opens the rendered diagram as a lightbox image", () => {
    const source = readFileSync(new URL("./mermaid-diagram.tsx", import.meta.url), "utf8");
    const previewSource = readFileSync(new URL("../../../../packages/ui/src/components/resource-preview.tsx", import.meta.url), "utf8");
    const lightboxSource = readFileSync(new URL("../../../../packages/ui/src/components/resource-preview-lightbox.tsx", import.meta.url), "utf8");
    expect(source).toContain('aria-label="Abrir diagrama Mermaid"');
    expect(source).toContain("ResourcePreview");
    expect(source).toContain("createMermaidSvgBlob(svg)");
    expect(source).toContain("getMermaidSvgDimensions(svg)");
    expect(source).toContain("srcSet: [{ src: previewSrc, ...dimensions }]");
    expect(source).toContain("URL.revokeObjectURL(url)");
    expect(source).toContain("triggerRef");
    expect(source).toContain("cursor-zoom-in");
    expect(previewSource).toContain("React.lazy");
    expect(lightboxSource).toContain("Zoom");
    expect(lightboxSource).not.toContain("Thumbnails");
    expect(lightboxSource).toContain("Fullscreen");
    expect(lightboxSource).toContain("DownloadPlugin");
    expect(lightboxSource).toContain("scrollToZoom: true");
    expect(lightboxSource).toContain("ChevronLeft");
    expect(lightboxSource).toContain("ChevronRight");
    expect(lightboxSource).toContain('colorScheme: "light"');
    expect(lightboxSource).toContain('"--yarl__container_background_color": "#FAFAF9"');
    expect(lightboxSource).toContain('"--yarl__color_button_active": "#D72228"');
    expect(lightboxSource).toContain('aria-label={isPrevious ? "Imagen anterior" : "Siguiente imagen"}');
    expect(lightboxSource).not.toContain("title={isPrevious");
    expect(lightboxSource).toContain("render={{");
    expect(source).not.toContain("Descargar SVG");
    expect(source).not.toContain("Abrir preview");
    expect(source).not.toContain("onWheel={handleWheel}");
    expect(source).not.toContain("setPointerCapture");
    expect(source).not.toContain("mermaid-viewport");
  });
});
