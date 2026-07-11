import { describe, expect, it } from "vitest";
import { TlozValidationError, nextMissionDisplayId, uniqueSlug, validateMissionCreate, validateProjectCreate, validateQuestItemCreate } from "./tloz-validation";

describe("TLOZ creation validation", () => {
  it("rejects incomplete entities before persistence", () => {
    expect(() => validateMissionCreate({ title: "", description: "", icon: "", type: "side_quest", status: "next", ownerId: "", projectId: "", progress: 0 })).toThrow(TlozValidationError);
    expect(() => validateProjectCreate({ name: "x", description: "", icon: "FolderKanban", color: "blue", status: "active", type: "normal", ownerId: "", startDate: "" })).toThrow(TlozValidationError);
    expect(() => validateQuestItemCreate({ name: "Key", description: "", icon: "KeyRound", status: "unlocked", category: "access" })).toThrow(TlozValidationError);
  });

  it("rejects an end date before the start date", () => {
    expect(() => validateProjectCreate({ name: "Core", description: "", icon: "FolderKanban", color: "#2D6CDF", status: "active", type: "normal", ownerId: "user-1", startDate: "2026-07-02", dueDate: "2026-07-01" })).toThrow(TlozValidationError);
  });

  it("applies stable mission defaults when optional fields are omitted", () => {
    expect(validateMissionCreate({
      title: "Document API defaults",
      type: "side_quest",
      ownerId: "user-1",
      projectId: "project-1",
    })).toMatchObject({
      description: "",
      icon: "Sword",
      status: "next",
      progress: 0,
    });
  });

  it("reports invalid mission fields without treating them as internal errors", () => {
    expect.assertions(1);
    try {
      validateMissionCreate({
        title: "",
        type: "side_quest",
        ownerId: "",
        projectId: "",
        progress: 101,
      });
    } catch (error) {
      expect(error).toMatchObject({
        fields: expect.objectContaining({
          title: expect.any(String),
          ownerId: expect.any(String),
          projectId: expect.any(String),
          progress: expect.any(String),
        }),
      });
    }
  });

  it("generates collision-free persistent route identifiers", () => {
    expect(uniqueSlug("Operación México", ["operacion-mexico"])).toBe("operacion-mexico-2");
    expect(nextMissionDisplayId("Core", ["COR-0001", "COR-0004", "GRO-0010"])).toBe("COR-0005");
  });
});
