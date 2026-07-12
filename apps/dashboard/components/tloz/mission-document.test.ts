import { describe, expect, it } from "vitest";
import { appendTaskLine, updateTaskLine, withoutTaskLines } from "./mission-document";

describe("mission document checklist", () => {
  const document = "Objetivo\n\nReferencia: API\n\n- [x] Conservar este estado\n- [ ] Renombrar este item";

  it("recognizes every supported markdown task marker", () => {
    expect(withoutTaskLines("Texto\n* [X] Uno\n+ [ ] Dos")).toBe("Texto");
  });

  it("updates a task in place without moving surrounding Markdown", () => {
    expect(updateTaskLine("# Objetivo\n\n- [ ] Primero\n\nTexto\n\n- [ ] Segundo", 1, { completed: true }))
      .toBe("# Objetivo\n\n- [ ] Primero\n\nTexto\n\n- [x] Segundo");
  });

  it("appends a task while preserving the existing detail", () => {
    expect(appendTaskLine("# Objetivo\n\nTexto", "Validar preview")).toBe("# Objetivo\n\nTexto\n- [ ] Validar preview");
  });
});
