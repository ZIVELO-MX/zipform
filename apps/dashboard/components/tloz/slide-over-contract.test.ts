import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../../../../packages/ui/src/components/slide-over.tsx"), "utf8");

describe("SlideOver dismissal", () => {
  it("uses an explicit backdrop and keeps picker content interactive", () => {
    expect(source).toContain("data-slide-over-backdrop");
    expect(source).toMatch(/data-slide-over-backdrop onClick=\{\(\) => dialogRef\.current\?\.close\(\)\}/);
    expect(source).toContain('className="slide-over-content-panel pointer-events-auto');
    expect(source).toContain("<OverlayPortalProvider container={portalContainer}>");
  });

  it("does not bind dismissal to the resize-side panel", () => {
    expect(source).not.toMatch(/ResizablePanel[^>]+onClick=.*close/);
  });
});
