import { describe, expect, it } from "vitest";
import { addDays, addMonths, calendarDateKey, missionCalendarBounds, parseCalendarDate } from "./mission-calendar-utils";

describe("mission calendar date helpers", () => {
  it("rejects invalid calendar dates and preserves local date parts", () => {
    expect(parseCalendarDate("2028-02-29")).toEqual({ year: 2028, month: 2, day: 29 });
    expect(parseCalendarDate("2027-02-29")).toBeNull();
    expect(parseCalendarDate("2028-2-09")).toBeNull();
  });

  it("returns complete month and Monday based week bounds", () => {
    const anchor = { year: 2028, month: 2, day: 29 };
    expect(missionCalendarBounds("agenda", anchor)).toEqual({ start: { year: 2028, month: 2, day: 1 }, end: { year: 2028, month: 2, day: 29 } });
    expect(missionCalendarBounds("month", anchor)).toEqual({ start: { year: 2028, month: 2, day: 1 }, end: { year: 2028, month: 2, day: 29 } });
    expect(missionCalendarBounds("week", { year: 2028, month: 1, day: 2 })).toEqual({ start: { year: 2027, month: 12, day: 27 }, end: { year: 2028, month: 1, day: 2 } });
  });

  it("formats stable keys for sorting and lookup", () => {
    expect(calendarDateKey({ year: 2026, month: 9, day: 5 })).toBe("2026-09-05");
  });

  it("handles leap day, month ends, and DST-safe local increments", () => {
    expect(addDays({ year: 2028, month: 2, day: 28 }, 1)).toEqual({ year: 2028, month: 2, day: 29 });
    expect(addDays({ year: 2028, month: 2, day: 29 }, 1)).toEqual({ year: 2028, month: 3, day: 1 });
    expect(addDays({ year: 2026, month: 10, day: 31 }, 1)).toEqual({ year: 2026, month: 11, day: 1 });
    expect(addMonths({ year: 2026, month: 12, day: 1 }, 1)).toEqual({ year: 2027, month: 1, day: 1 });
  });
});
