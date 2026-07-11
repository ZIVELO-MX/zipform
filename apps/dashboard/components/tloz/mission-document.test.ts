import { describe, expect, it } from "vitest";
import { withChecklist, withoutTaskLines } from "./mission-document";

describe("mission document checklist", () => {
  const document = "Objetivo\n\nReferencia: API\n\n- [x] Conservar este estado\n- [ ] Renombrar este item";

  it("keeps non-checklist markdown when checklist items are renamed", () => {
    expect(withChecklist(document, [
      { title: "Conservar este estado", completed: true },
      { title: "Nombre actualizado", completed: false },
    ])).toBe("Objetivo\n\nReferencia: API\n- [x] Conservar este estado\n- [ ] Nombre actualizado");
  });

  it("removes only the selected checklist item", () => {
    expect(withChecklist(document, [{ title: "Conservar este estado", completed: true }]))
      .toBe("Objetivo\n\nReferencia: API\n- [x] Conservar este estado");
  });

  it("recognizes every supported markdown task marker", () => {
    expect(withoutTaskLines("Texto\n* [X] Uno\n+ [ ] Dos")).toBe("Texto");
  });
});
