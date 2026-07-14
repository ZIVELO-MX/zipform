export function isMermaidCodeBlock(className?: string) {
  return className?.split(/\s+/).includes("language-mermaid") ?? false;
}
