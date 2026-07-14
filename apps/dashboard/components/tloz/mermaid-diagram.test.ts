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
});
