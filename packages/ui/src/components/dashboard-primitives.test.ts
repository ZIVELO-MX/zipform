import { describe, expect, it } from "vitest";
import { displayUsername } from "./dashboard-primitives";

describe("displayUsername", () => {
  it("capitalizes only the displayed first character", () => {
    const username = "zibot";
    expect(displayUsername(username)).toBe("Zibot");
    expect(username).toBe("zibot");
  });

  it("keeps an empty username empty", () => {
    expect(displayUsername("")).toBe("");
  });
});
