import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("mission status selector", () => {
  it("keeps the Radix value anchor required by item-aligned content", () => {
    const source = readFileSync(new URL("./mission-inline-editor.tsx", import.meta.url), "utf8");

    expect(source).toMatch(
      /<SelectTrigger aria-label="Estado"><SelectValue><OptionValue value=\{status\} options=\{statusOptions\} status kind=\{options\?\.document\?\.kind\} \/><\/SelectValue><\/SelectTrigger><SelectContent position="item-aligned">/,
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
    expect(source).toContain("<SelectValue><OptionValue value={values.type} options={categoryOptions} /></SelectValue>");
    expect(source).toContain("<OptionValue value={option.value} options={categoryOptions} />");
    expect(source).toContain("style={{ background: `${color}18`, color }}");
    expect(source).toContain("iconComponent: resolveMissionIcon(project.icon)");
    expect(source).toContain("<ProjectValue project={values.project ?? selectedProject} />");
  });

  it("shows the inherited Mission color as a read-only property", () => {
    const source = readFileSync(new URL("./mission-inline-editor.tsx", import.meta.url), "utf8");
    expect(source).toContain('label="Color"');
    expect(source).toContain("inheritedColor");
    expect(source).toContain("<InheritedColorValue value={inheritedColor} />");
  });

  it("uses the shared projection and presentation metadata in detail rows", () => {
    const source = readFileSync(new URL("./mission-inline-editor.tsx", import.meta.url), "utf8");
    expect(source).toContain("options?.detailProperties?.core");
    expect(source).toContain('visibleProperties.has("project")');
    expect(source).toContain("options?.presentationFields");
    expect(source).toContain("readOnly={readOnly}");
  });

  it("separates reassignment permission from ordinary property updates", () => {
    const source = readFileSync(new URL("./mission-inline-editor.tsx", import.meta.url), "utf8");
    expect(source).toContain("responsibleReadOnly = readOnly");
    expect(source).toContain("readOnly={responsibleReadOnly}");
    expect(source).toContain("onUpdate(current.id, input)");
    expect(source).toContain("onStatusUpdate(current.id, value)");
  });
});
