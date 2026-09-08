export type MissionCalendarMode = "agenda" | "month" | "week";
export type CalendarDate = { year: number; month: number; day: number };
export function parseCalendarDate(value: string): CalendarDate | null { const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value); if (!match) return null; const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]); if (year < 1) return null; const date = toDate({year, month, day}); return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? { year, month, day } : null; }
export function calendarDateKey(date: CalendarDate) { return `${String(date.year).padStart(4, "0")}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`; }
function toDate(date: CalendarDate) { const result = new Date(0); result.setHours(0, 0, 0, 0); result.setFullYear(date.year, date.month - 1, date.day); return result; }
function fromDate(date: Date): CalendarDate { return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() }; }
export function addDays(date: CalendarDate, amount: number) { const next = toDate(date); next.setDate(next.getDate() + amount); return fromDate(next); }
export function addMonths(date: CalendarDate, amount: number) { const next = toDate({ ...date, day: 1 }); next.setMonth(next.getMonth() + amount); return fromDate(next); }
export function startOfWeek(date: CalendarDate) { const day = toDate(date).getDay(); return addDays(date, day === 0 ? -6 : 1 - day); }
export function endOfWeek(date: CalendarDate) { return addDays(startOfWeek(date), 6); }
function endOfMonth(date: CalendarDate) { return { ...date, day: toDate({ year: date.year, month: date.month + 1, day: 0 }).getDate() }; }
export function dateRange(start: CalendarDate, end: CalendarDate) { const result: CalendarDate[] = []; for (let current = start; calendarDateKey(current) <= calendarDateKey(end); current = addDays(current, 1)) result.push(current); return result; }
export function missionCalendarBounds(mode: MissionCalendarMode, anchor: CalendarDate) { if (mode === "week") { const start = startOfWeek(anchor); return { start, end: addDays(start, 6) }; } return { start: { ...anchor, day: 1 }, end: endOfMonth(anchor) }; }
