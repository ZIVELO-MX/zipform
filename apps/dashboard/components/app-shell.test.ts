import { describe, expect, it } from "vitest";
import { buildTlozSections } from "./tloz-sidebar";

describe("TLOZ sidebar", () => {
  it("exposes Workshop and Library alongside shared system containers", () => {
    const sections = buildTlozSections([], new Map(), new Map());
    const system = sections.find((section) => section.label === "Sistema");
    expect(system?.items.map((item) => ({ label: item.label, href: item.href }))).toEqual([
      { label: "Inventory", href: "/inventory" },
      { label: "Projects", href: "/projects" },
      { label: "Workshop", href: "/workshop" },
      { label: "Library", href: "/library" },
    ]);
  });
});
