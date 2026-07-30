import { describe, expect, it } from "vitest";
import { buildSystemContainer, SYSTEM_LIBRARY_ID, SYSTEM_WORKSHOP_ID } from "./container-content-backfill";

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
});
