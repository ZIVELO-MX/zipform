import { describe, expect, it } from "vitest";
import { getMissionDueDatePresentation } from "./mission-due-date-state";

describe("mission due date presentation", () => {
  const now = new Date(2026, 2, 8, 23, 30);

  it.each([
    [undefined, "missing"],
    ["", "missing"],
    ["not-a-date", "invalid"],
    ["0000-01-01", "invalid"],
    ["2026-02-30", "invalid"],
  ] as const)("treats %s as %s", (date, state) => {
    expect(getMissionDueDatePresentation(date, false, now)).toEqual({
      state,
      label: "Sin fecha",
    });
  });

  it("compares calendar dates in local time across a DST boundary", () => {
    expect(getMissionDueDatePresentation("2026-03-07", false, now)).toMatchObject({ state: "overdue", label: "Vencida · 07 mar 2026" });
    expect(getMissionDueDatePresentation("2026-03-08", false, now)).toEqual({ state: "today", label: "Hoy", dateTime: "2026-03-08" });
    expect(getMissionDueDatePresentation("2026-03-09", false, now)).toMatchObject({ state: "future", label: "09 mar 2026" });
  });

  it("accepts an injected local calendar snapshot", () => {
    expect(getMissionDueDatePresentation("2026-03-08", false, "2026-03-08"))
      .toEqual({ state: "today", label: "Hoy", dateTime: "2026-03-08" });
  });

  it("keeps completed dates neutral regardless of whether they passed", () => {
    expect(getMissionDueDatePresentation("2026-03-07", true, now)).toEqual({
      state: "completed",
      label: "07 mar 2026",
      dateTime: "2026-03-07",
    });
  });
});
