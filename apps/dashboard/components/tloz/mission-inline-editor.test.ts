import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("mission status selector", () => {
  it("keeps the Radix value anchor required by item-aligned content", () => {
    const source = readFileSync(new URL("./mission-inline-editor.tsx", import.meta.url), "utf8");

    expect(source).toMatch(
      /<SelectTrigger aria-label="Estado"><SelectValue><StatusValue status=\{status\} \/><\/SelectValue><\/SelectTrigger><SelectContent position="item-aligned">/,
    );
  });

  it("supports stacked detail rows and a responsive two-column creation grid", () => {
    const source = readFileSync(new URL("./mission-inline-editor.tsx", import.meta.url), "utf8");
    expect(source).toContain('layout?: "stacked" | "grid"');
    expect(source).toContain('"grid grid-cols-1 gap-1 sm:grid-cols-2"');
    expect(source).toContain('data-layout={layout}');
  });

  it("shows category color and project icon with color in triggers and options", () => {
    const source = readFileSync(new URL("./mission-inline-editor.tsx", import.meta.url), "utf8");
    expect(source).toContain("<SelectValue><TypeValue type={values.type} /></SelectValue>");
    expect(source).toContain("<TypeValue type={value} />");
    expect(source).toContain("iconComponent: resolveMissionIcon(project.icon)");
    expect(source).toContain("<ProjectValue project={values.project ?? selectedProject} />");
  });
});
