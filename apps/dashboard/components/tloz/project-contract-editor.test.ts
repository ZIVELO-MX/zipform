import { describe, expect, it } from "vitest";
import type { TlozFieldDefinition } from "@tloz/types";
import { normalizeFieldPositions } from "./project-contract";

describe("Project contract field ordering", () => {
  it("normalizes positions without changing stable field keys or values", () => {
    const fields = [
      { id: "priority", key: "priority", label: "Prioridad", position: 8 },
      { id: "status", key: "status", label: "Estado", position: 3 },
    ] as TlozFieldDefinition[];

    expect(normalizeFieldPositions(fields)).toEqual([
      expect.objectContaining({ id: "priority", key: "priority", position: 0 }),
      expect.objectContaining({ id: "status", key: "status", position: 1 }),
    ]);
  });
});
