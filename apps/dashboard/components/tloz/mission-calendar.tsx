"use client";

import { ChevronLeft, ChevronRight, List, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Button,
  EmptyState,
  StatusPill,
  UserAvatarLabel,
} from "@tloz/ui";
import type { TlozFieldOption } from "@tloz/types";
import type { TlozMissionRecord } from "../../lib/tloz-data";
import { useTlozViewState } from "./tloz-view-state";
import { missionTypeTone, resolveStatusPresentation } from "./tloz-utils";
import { addDays, addMonths, calendarDateKey, dateRange, endOfWeek, missionCalendarBounds, parseCalendarDate, startOfWeek, type CalendarDate, type MissionCalendarMode } from "./mission-calendar-utils";
import { HorizontalScrollArea } from "./horizontal-scroll-area";
import { MissionDueDate, useLocalToday } from "./mission-due-date";

function toDate(date: CalendarDate) { const result = new Date(0); result.setFullYear(date.year, date.month - 1, date.day); result.setHours(12, 0, 0, 0); return result; }
function monthLabel(date: CalendarDate) { return new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(toDate(date)); }
function shortDate(date: CalendarDate) { return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(toDate(date)); }
function weekdayLabel(date: CalendarDate) { return new Intl.DateTimeFormat("es-MX", { weekday: "short" }).format(toDate(date)); }

export function MissionCalendar({ missions, onSelect, statusOptions = [] }: {
  missions: TlozMissionRecord[];
  onSelect?: (mission: TlozMissionRecord) => void;
  statusOptions?: TlozFieldOption[];
}) {
  const { setState } = useTlozViewState();
  const today = useLocalToday();
  const [mode, setMode] = useState<MissionCalendarMode>("agenda");
  const [selectedDate, setAnchor] = useState<CalendarDate | null>(null);
  const todayDate = parseCalendarDate(today)!;
  const anchor = selectedDate ?? todayDate;
  const datedMissions = useMemo(() => missions
    .map((mission) => ({ mission, date: mission.dueDate ? parseCalendarDate(mission.dueDate) : null }))
    .filter((item): item is { mission: TlozMissionRecord; date: CalendarDate } => Boolean(item.date))
    .sort((left, right) => calendarDateKey(left.date).localeCompare(calendarDateKey(right.date)) || left.mission.title.localeCompare(right.mission.title)), [missions]);
  const bounds = missionCalendarBounds(mode, anchor);
  const visible = mode === "agenda" ? datedMissions : datedMissions.filter(({ date }) => calendarDateKey(date) >= calendarDateKey(bounds.start) && calendarDateKey(date) <= calendarDateKey(bounds.end));
  const grouped = useMemo(() => {
    const groups = new Map<string, { date: CalendarDate; missions: TlozMissionRecord[] }>();
    visible.forEach(({ date, mission }) => { const key = calendarDateKey(date); const current = groups.get(key); groups.set(key, current ? { ...current, missions: [...current.missions, mission] } : { date, missions: [mission] }); });
    return [...groups.values()];
  }, [visible]);
  const days = dateRange(bounds.start, bounds.end);

  function move(amount: number) { setAnchor(mode === "week" ? addDays(anchor, amount * 7) : addMonths(anchor, amount)); }
  function resetToday() { setAnchor(null); }

  return (
    <section className="flex min-w-0 flex-col gap-3" aria-label="Calendario de misiones">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {mode !== "agenda" ? <><Button type="button" variant="outline" size="icon-xs" aria-label="Periodo anterior" onClick={() => move(-1)}><ChevronLeft className="size-3.5" aria-hidden="true" /></Button><Button type="button" variant="outline" size="icon-xs" aria-label="Periodo siguiente" onClick={() => move(1)}><ChevronRight className="size-3.5" aria-hidden="true" /></Button><Button type="button" variant="outline" size="sm" className="h-7 gap-1 px-2 text-[11px]" onClick={resetToday}><RotateCcw className="size-3" aria-hidden="true" />Hoy</Button></> : null}
          <h2 className="m-0 truncate px-1 text-sm font-bold first-letter:uppercase text-carbon">{mode === "agenda" ? "Todas las fechas" : mode === "week" ? `${shortDate(bounds.start)} – ${shortDate(bounds.end)}` : monthLabel(anchor)}</h2>
        </div>
        <div className="flex shrink-0 rounded-lg bg-carbon/5 p-0.5" role="group" aria-label="Modo de calendario">
          {(["agenda", "month", "week"] as const).map((option) => <button key={option} type="button" aria-pressed={mode === option} className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${mode === option ? "bg-white text-carbon shadow-sm" : "text-carbon/65"}`} onClick={() => setMode(option)}>{option === "agenda" ? "Agenda" : option === "month" ? "Mes" : "Semana"}</button>)}
        </div>
      </div>

      {datedMissions.length === 0 && mode === "agenda" ? <CalendarEmpty onList={() => setState({ view: "list" })} /> : mode === "agenda" ? (
        <div className="flex min-w-0 flex-col gap-2">{grouped.map((group) => <div key={calendarDateKey(group.date)} className="rounded-xl border border-carbon/10 bg-white"><div className="flex items-center justify-between border-b border-carbon/[0.07] px-3 py-2"><span className="text-xs font-bold first-letter:uppercase text-carbon">{weekdayLabel(group.date)} {shortDate(group.date)}</span><span className="font-mono text-[11px] text-carbon/65">{group.missions.length}</span></div><div className="divide-y divide-carbon/[0.06]">{group.missions.map((mission) => <MissionCalendarRow key={mission.id} mission={mission} statusOptions={statusOptions} onSelect={onSelect} />)}</div></div>)}</div>
      ) : <HorizontalScrollArea label="Calendario" viewportClassName="max-w-full"><CalendarGrid today={today} anchor={anchor} days={days} missions={visible} mode={mode} onSelect={onSelect} statusOptions={statusOptions} /></HorizontalScrollArea>}
    </section>
  );
}

function CalendarEmpty({ onList }: { onList: () => void }) {
  return <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-carbon/15 p-6 text-center"><EmptyState title="Sin misiones con fecha" description="Añade una fecha límite para ver el trabajo en Calendario." /><Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onList}><List className="size-3.5" aria-hidden="true" />Ver Lista</Button></div>;
}

function MissionCalendarRow({ mission, statusOptions, onSelect }: { mission: TlozMissionRecord; statusOptions: TlozFieldOption[]; onSelect?: (mission: TlozMissionRecord) => void }) {
  const status = resolveStatusPresentation(mission.status, statusOptions);
  return <button type="button" className="flex w-full min-w-0 items-center gap-3 px-3 py-2.5 text-left hover:bg-carbon/[0.025] focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-zivelo" onClick={() => onSelect?.(mission)} aria-label={`Abrir ${mission.displayId}: ${mission.title}`}><span className="min-w-0 flex-1"><span className="flex min-w-0 items-center gap-2"><span className="max-w-20 shrink-0 truncate whitespace-nowrap font-mono text-[11px] text-carbon/65">{mission.displayId}</span><strong className="min-w-0 text-[13px] [overflow-wrap:anywhere]" title={mission.title}>{mission.title}</strong></span><span className="mt-1 flex min-w-0 items-center gap-2 text-[11px] text-carbon/65"><span className="truncate">{mission.project?.name ?? "Sin proyecto"}</span><UserAvatarLabel name={mission.owner.name} label={mission.owner.username ? `@${mission.owner.username}` : mission.owner.name} labelOnly imageUrl={mission.owner.avatarUrl} size="sm" /></span></span><MissionDueDate date={mission.dueDate} completed={status.role === "done"} className="shrink-0" /><StatusPill label={status.label} color={status.textColor} active={status.role === "active"} /></button>;
}

function CalendarGrid({ today, anchor, days, missions, mode, statusOptions, onSelect }: { today: string; anchor: CalendarDate; days: CalendarDate[]; missions: Array<{ mission: TlozMissionRecord; date: CalendarDate }>; mode: "month" | "week"; statusOptions: TlozFieldOption[]; onSelect?: (mission: TlozMissionRecord) => void }) {
  const gridDays = mode === "month" && days.length ? dateRange(startOfWeek(days[0]), endOfWeek(days[days.length - 1])) : days;
  const byDay = new Map<string, TlozMissionRecord[]>();
  missions.forEach(({ date, mission }) => byDay.set(calendarDateKey(date), [...(byDay.get(calendarDateKey(date)) ?? []), mission]));
  const rows: CalendarDate[][] = [];
  for (let index = 0; index < gridDays.length; index += 7) rows.push(gridDays.slice(index, index + 7));
  return <table className="w-full min-w-[700px] table-fixed border-collapse bg-carbon/10 text-left" aria-label={mode === "month" ? "Vista mensual" : "Vista semanal"}><thead><tr>{gridDays.slice(0, 7).map((day) => <th key={calendarDateKey(day)} scope="col" className="bg-white px-2 py-2 text-center text-[11px] font-bold uppercase text-carbon/65">{weekdayLabel(day)}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={calendarDateKey(row[0])}>{row.map((day) => <td key={calendarDateKey(day)} className={`h-28 min-w-0 align-top border border-carbon/10 p-1.5 ${day.month === anchor.month || mode === "week" ? "bg-white" : "bg-[#F7F7F6]"}`}><time dateTime={calendarDateKey(day)} aria-current={calendarDateKey(day) === today ? "date" : undefined} className="mb-1 inline-block rounded px-1 font-mono text-[11px] text-carbon/65 aria-[current=date]:bg-carbon aria-[current=date]:text-white">{day.day}</time><div className="flex max-h-72 min-w-0 flex-col gap-1 overflow-y-auto">{(byDay.get(calendarDateKey(day)) ?? []).map((mission) => <CalendarGridMission key={mission.id} mission={mission} statusOptions={statusOptions} onSelect={onSelect} />)}</div></td>)}</tr>)}</tbody></table>;
}

function CalendarGridMission({ mission, statusOptions, onSelect }: { mission: TlozMissionRecord; statusOptions: TlozFieldOption[]; onSelect?: (mission: TlozMissionRecord) => void }) {
  const status = resolveStatusPresentation(mission.status, statusOptions);
  return <button type="button" className="flex min-w-0 shrink-0 flex-col gap-0.5 rounded-md border-l bg-carbon/[0.035] px-1.5 py-1 text-left text-[11px] hover:bg-carbon/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-zivelo" style={{ borderLeftColor: missionTypeTone[mission.type] }} onClick={() => onSelect?.(mission)} aria-label={`Abrir ${mission.displayId}: ${mission.title}`}><span className="line-clamp-3 font-semibold text-carbon [overflow-wrap:anywhere]" title={mission.title}>{mission.title}</span><span className="flex min-w-0 flex-wrap items-center gap-1 text-[11px] text-carbon/65"><span className="truncate">{mission.owner.username ? `@${mission.owner.username}` : mission.owner.name}</span><StatusPill label={status.label} color={status.textColor} active={status.role === "active"} /></span><MissionDueDate date={mission.dueDate} completed={status.role === "done"} className="self-start text-[11px]" /></button>;
}
