import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const detail = readFileSync(new URL("./mission-detail.tsx", import.meta.url), "utf8");
const editor = readFileSync(new URL("./markdown-editor.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
const utils = readFileSync(new URL("./tloz-utils.ts", import.meta.url), "utf8");

describe("mission detail interaction contracts", () => {
  it("opens Description by default through the shared accordion", () => {
    expect(detail).toContain('defaultValue="description"');
    expect(detail).toContain("<AccordionContent");
  });

  it("animates checklist filtering while respecting reduced motion", () => {
    expect(detail).toContain('key={checklistFilter} className="mission-checklist-filter');
    expect(styles).toContain("@keyframes mission-checklist-filter-in");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("keeps a large Markdown textarea and removes the fake visual editor", () => {
    expect(editor).toContain("min-h-[45dvh]");
    expect(editor).toContain("md:min-h-80");
    expect(editor).not.toContain("contentEditable");
    expect(editor).not.toContain('label: "Visual"');
  });

  it("uses TLOZ red for completed state tokens and badges", () => {
    expect(utils).toMatch(/completed: "#D72228"/);
    expect(detail).toContain('bg-[#FDECEC] text-[#B91C22]');
  });

  it("keeps AddResource responsive and captures a manual icon", () => {
    expect(detail).toContain("flex min-w-0 flex-col gap-2 rounded-xl");
    expect(detail).toContain("sm:grid-cols-[40px_130px_minmax(0,1fr)]");
    expect(detail).toContain("...(icon ? { icon } : {})");
    expect(detail).not.toContain("sm:grid-cols-[140px_1fr_1fr_auto_auto]");
  });
});
