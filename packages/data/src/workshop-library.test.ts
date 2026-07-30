import { describe, expect, it } from "vitest";
import {
  buildSystemContainer,
  LIBRARY_DEFINITION,
  SYSTEM_LIBRARY_ID,
  SYSTEM_WORKSHOP_ID,
  WORKSHOP_DEFINITION,
} from "./container-content-backfill";

const definition = { fields: [], views: [{ id: "list", fields: [] }], defaultView: "list" };

describe("Workshop and Library system containers", () => {
  it("uses the shared Container contract with presentation-only identity", () => {
    const date = new Date("2026-01-01T00:00:00.000Z");
    const workshop = buildSystemContainer(SYSTEM_WORKSHOP_ID, "Workshop", "workshop", definition, date, date);
    const library = buildSystemContainer(SYSTEM_LIBRARY_ID, "Library", "library", definition, date, date);

    expect(workshop).toMatchObject({ id: "system-workshop", publicId: "workshop", presentation: "workshop", data: {} });
    expect(library).toMatchObject({ id: "system-library", publicId: "library", presentation: "library", data: {} });
    expect(workshop).not.toHaveProperty("kind");
    expect(library).not.toHaveProperty("kind");
  });

  it("configures Workshop like a basic Project without speculative fields", () => {
    expect(WORKSHOP_DEFINITION.defaultView).toBe("table");
    expect(WORKSHOP_DEFINITION.fields.map((field) => field.key)).toEqual([
      "status",
      "category",
      "ownerId",
      "startDate",
      "dueDate",
    ]);
    expect(WORKSHOP_DEFINITION.views).toEqual([
      { id: "list", fields: ["title", "status"] },
      { id: "table", fields: ["title", "status", "category", "ownerId", "dueDate"] },
      { id: "detail", fields: ["publicId", "status", "category", "ownerId", "startDate", "dueDate"] },
    ]);
    expect(WORKSHOP_DEFINITION.fields.find((field) => field.key === "status")?.options?.map((option) => option.value))
      .toEqual(["planned", "active", "archived"]);
  });

  it("configures Library like a basic Inventory item", () => {
    expect(LIBRARY_DEFINITION.defaultView).toBe("table");
    expect(LIBRARY_DEFINITION.fields.map((field) => field.key)).toEqual([
      "status",
      "category",
      "ownerId",
      "acquiredAt",
    ]);
    expect(LIBRARY_DEFINITION.views).toEqual([
      { id: "list", fields: ["title", "status"] },
      { id: "table", fields: ["title", "status", "category", "ownerId", "acquiredAt"] },
      { id: "detail", fields: ["publicId", "status", "category", "ownerId", "acquiredAt"] },
    ]);
    expect(LIBRARY_DEFINITION.fields.find((field) => field.key === "status")?.options?.map((option) => option.value))
      .toEqual(["locked", "unlocked"]);
  });
});
