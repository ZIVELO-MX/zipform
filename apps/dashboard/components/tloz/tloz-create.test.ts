import { describe, expect, it } from "vitest";
import { initialDraft } from "./tloz-create-defaults";
import { buildCreateInput } from "./tloz-create-input";

describe("TLOZ mission creation defaults", () => {
  it("starts missions as later with the resolved owner and project", () => {
    expect(initialDraft("mission", "zibot-id", "zivelo-id", "2026-07-11")).toMatchObject({
      ownerId: "zibot-id",
      projectId: "zivelo-id",
      status: "later",
    });
  });
});

describe("TLOZ mission creation payload", () => {
  it("keeps dependencies, Quest Items, resources, and manual resource icons atomic", () => {
    const input = buildCreateInput("mission", {
      name: "Atomic mission",
      description: "Summary",
      descriptionDetail: "- [ ] Ship",
      icon: "Sword",
      type: "side_quest",
      status: "later",
      ownerId: "owner-1",
      projectId: "project-1",
      startDate: "",
      dueDate: "",
      dependencyIds: "mission-a,mission-b",
      requiredQuestItemIds: "quest-a",
    }, [{ type: "link", title: "Repository", url: "https://github.com/org/repo", icon: "Github" }]);

    expect(input).toMatchObject({
      dependencyIds: ["mission-a", "mission-b"],
      requiredQuestItemIds: ["quest-a"],
      resources: [{ type: "link", title: "Repository", icon: "Github" }],
    });
  });
});
