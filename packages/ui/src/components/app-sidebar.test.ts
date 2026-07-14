import { describe, expect, it } from "vitest";
import { visibleNavItems, type NavSection } from "./app-sidebar";

const section: NavSection = {
  label: "Proyectos",
  visibleItemLimit: 4,
  items: Array.from({ length: 6 }, (_, index) => ({
    label: `Project ${index + 1}`,
    href: `/projects/${index + 1}`,
    icon: () => null,
  })),
};

describe("expandable navigation sections", () => {
  it("shows four entries before expansion and every entry afterward", () => {
    expect(visibleNavItems(section, false).map((item) => item.label)).toEqual(["Project 1", "Project 2", "Project 3", "Project 4"]);
    expect(visibleNavItems(section, true)).toEqual(section.items);
  });
});
