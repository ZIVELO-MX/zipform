import { describe, expect, it } from "vitest";
import { clampResourcePreviewIndex } from "./resource-preview";

describe("ResourcePreview", () => {
  it("clamps the initial index to the available slide range", () => {
    expect(clampResourcePreviewIndex(-1, 2)).toBe(0);
    expect(clampResourcePreviewIndex(1, 2)).toBe(1);
    expect(clampResourcePreviewIndex(10, 2)).toBe(1);
    expect(clampResourcePreviewIndex(4, 0)).toBe(0);
  });

  it("keeps the lightbox implementation out of the closed render path", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("./resource-preview.tsx", import.meta.url), "utf8"),
    );
    const lightboxSource = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("./resource-preview-lightbox.tsx", import.meta.url), "utf8"),
    );
    expect(source).toContain('React.lazy(() =>');
    expect(source).toContain('if (!open || slides.length === 0) return null;');
    expect(source).toContain("onExited");
    expect(lightboxSource).toContain('plugins={[Zoom, Thumbnails, Fullscreen]}');
    expect(lightboxSource).toContain('controller={{ aria: true }}');
    expect(lightboxSource).toContain('Next: "Siguiente imagen"');
    expect(lightboxSource).toContain('fetchPriority={offset === 0 ? "high" : "low"}');
  });
});
