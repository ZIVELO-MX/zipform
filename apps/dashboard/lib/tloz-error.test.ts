import { describe, expect, it } from "vitest";
import { tlozErrorMessage } from "./tloz-error";

describe("TLOZ UI error messages", () => {
  it.each([
    ["UNAUTHORIZED", "Tu sesión ya no es válida. Inicia sesión de nuevo."],
    ["FORBIDDEN", "No tienes permiso para realizar esta acción."],
    ["LAST_OWNER", "No se puede quitar al último Platform Owner."],
  ])("maps %s to accessible feedback", (code, expected) => {
    expect(tlozErrorMessage({ code }, "fallback")).toBe(expected);
  });

  it("preserves a useful server message when no typed code is present", () => {
    expect(tlozErrorMessage(new Error("No tienes permisos para cambiar este rol."), "fallback")).toBe("No tienes permiso para realizar esta acción.");
  });
});
