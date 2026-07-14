import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("EntityPicker option presentation", () => {
  it("uses the same icon-and-color visual in the trigger and options", () => {
    const source = readFileSync(new URL("./entity-picker.tsx", import.meta.url), "utf8");
    expect(source).toContain("<EntityOptionIcon option={selected} compact />");
    expect(source).toContain("<EntityOptionIcon option={option} />");
    expect(source).toContain("option.iconColor ?? option.color");
    expect(source).toContain("`${option.color}18`");
  });
});
