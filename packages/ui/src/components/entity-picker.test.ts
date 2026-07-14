import { describe, expect, it } from "vitest";
import { entityOptionColors, type EntityPickerOption } from "./entity-picker";

describe("EntityPicker option presentation", () => {
  it("uses the same icon-and-color visual in the trigger and options", () => {
    const option: EntityPickerOption = { id: "tloz", name: "TLOZ", color: "#D72228", iconComponent: () => null };
    expect(entityOptionColors(option)).toEqual({ color: "#D72228", backgroundColor: "#D7222818" });
    expect(entityOptionColors({ ...option, iconColor: "#111111", iconBackground: "#EEEEEE" })).toEqual({ color: "#111111", backgroundColor: "#EEEEEE" });
  });
});
