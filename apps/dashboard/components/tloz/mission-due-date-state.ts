export type MissionDueState = "missing" | "invalid" | "overdue" | "today" | "future" | "completed";

export type MissionDueDatePresentation = {
  state: MissionDueState;
  label: string;
  dateTime?: string;
};

export function getMissionDueDatePresentation(
  date?: string,
  completed = false,
  now: Date | string = new Date(),
): MissionDueDatePresentation {
  if (!date) return { state: "missing", label: "Sin fecha" };
  const parsed = parseCalendarDate(date);
  if (!parsed) return { state: "invalid", label: "Sin fecha" };

  const displayDate = new Date(0);
  displayDate.setFullYear(parsed.year, parsed.month - 1, parsed.day);
  displayDate.setHours(12, 0, 0, 0);
  const label = new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(displayDate);
  if (completed) return { state: "completed", label, dateTime: date };

  const due = calendarDateNumber(parsed);
  const today = typeof now === "string"
    ? calendarDateNumber(parseCalendarDate(now) ?? { year: 1, month: 1, day: 1 })
    : now.getFullYear() * 10_000 + (now.getMonth() + 1) * 100 + now.getDate();
  if (due < today) return { state: "overdue", label: `Vencida · ${label}`, dateTime: date };
  if (due === today) return { state: "today", label: "Hoy", dateTime: date };
  return { state: "future", label, dateTime: date };
}

function parseCalendarDate(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

function calendarDateNumber(date: { year: number; month: number; day: number }) {
  return date.year * 10_000 + date.month * 100 + date.day;
}

function daysInMonth(year: number, month: number) {
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}
