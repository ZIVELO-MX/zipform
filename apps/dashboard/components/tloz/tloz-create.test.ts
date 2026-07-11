import { describe, expect, it } from "vitest";
import { initialDraft } from "./tloz-create-defaults";

describe("TLOZ mission creation defaults", () => {
  it("starts missions as later with the resolved owner and project", () => {
    expect(initialDraft("mission", "zibot-id", "zivelo-id", "2026-07-11")).toMatchObject({
      ownerId: "zibot-id",
      projectId: "zivelo-id",
      status: "later",
    });
  });
});
