"use client";

import { cn } from "@tloz/ui";
import { useSyncExternalStore } from "react";
import { getMissionDueDatePresentation } from "./mission-due-date-state";

const serverToday = "1970-01-01";
const subscribers = new Set<() => void>();
let midnightTimer: ReturnType<typeof setTimeout> | undefined;

function localToday() {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
}

function getTodaySnapshot() {
  return localToday();
}

function scheduleMidnight() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  midnightTimer = setTimeout(() => {
    subscribers.forEach((notify) => notify());
    scheduleMidnight();
  }, next.getTime() - now.getTime() + 50);
}

function subscribeToToday(notify: () => void) {
  subscribers.add(notify);
  if (subscribers.size === 1) scheduleMidnight();
  return () => {
    subscribers.delete(notify);
    if (subscribers.size === 0 && midnightTimer) {
      clearTimeout(midnightTimer);
      midnightTimer = undefined;
    }
  };
}

export function useLocalToday() {
  return useSyncExternalStore(subscribeToToday, getTodaySnapshot, () => serverToday);
}

export function MissionDueDate({
  date,
  completed = false,
  className,
}: {
  date?: string;
  completed?: boolean;
  className?: string;
}) {
  const due = getMissionDueDatePresentation(date, completed, useLocalToday());
  return (
    <time
      className={cn(
        "font-mono text-[11.5px] font-semibold",
        due.state === "overdue"
          ? "text-zivelo"
          : due.state === "today" ? "text-carbon/75" : "text-carbon/65",
        className,
      )}
      dateTime={due.dateTime}
      data-due-state={due.state}
    >
      {due.label}
    </time>
  );
}
