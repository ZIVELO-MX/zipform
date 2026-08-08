import { describe, expect, it } from "vitest";
import { orderMissionListStatuses } from "./mission-list-order";

describe("orderMissionListStatuses", () => {
  it("orders the canonical Mission statuses before custom states and completed", () => {
    expect(orderMissionListStatuses([
      "completed",
      "blocked",
      "later",
      "now",
      "review",
      "next",
    ])).toEqual(["now", "next", "later", "blocked", "review", "completed"]);
  });

  it("uses contract order for custom states while keeping completed last", () => {
    expect(orderMissionListStatuses(
      ["completed", "blocked", "review", "now"],
      [
        { value: "review", label: "Review" },
        { value: "completed", label: "Completed", role: "done" },
        { value: "blocked", label: "Blocked", role: "blocked" },
      ],
    )).toEqual(["now", "review", "blocked", "completed"]);
  });
});
