// Time-off conflict checking. Used by the booking + consultation APIs to
// reject submissions that overlap a planner-blocked window, and by the admin
// calendar to render the blocks.

import { prisma } from "./prisma";
import type { TimeOff } from "@prisma/client";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Returns the matching TimeOff row if the given window overlaps a block,
 * otherwise null. `end` defaults to `start` (point-in-time check). */
export async function findBlockingTimeOff(
  start: Date,
  end?: Date,
): Promise<TimeOff | null> {
  const windowEnd = end ?? start;

  // Pull rows that could plausibly overlap: any one-time row whose window
  // intersects, plus any weekly recurrence whose recurUntil is unset or
  // still in the future. This is a cheap superset — we walk it in JS to do
  // the precise weekday + time-of-day match.
  const candidates = await prisma.timeOff.findMany({
    where: {
      OR: [
        { recurrence: "NONE", startAt: { lte: windowEnd }, endAt: { gt: start } },
        {
          recurrence: "WEEKLY",
          startAt: { lte: windowEnd },
          OR: [{ recurUntil: null }, { recurUntil: { gte: start } }],
        },
      ],
    },
  });

  for (const t of candidates) {
    if (overlaps(t, start, windowEnd)) return t;
  }
  return null;
}

function overlaps(t: TimeOff, start: Date, end: Date): boolean {
  if (t.recurrence === "NONE") {
    return t.startAt < end && t.endAt > start;
  }
  // WEEKLY
  if (t.recurDays.length === 0) return false;
  if (t.startAt > end) return false;
  if (t.recurUntil && t.recurUntil < start) return false;

  // Walk each day in [start, end] (cap at a year to avoid pathological loops)
  // and check whether that day's weekday is in recurDays, and whether the
  // time-of-day window overlaps. allDay = whole day blocked.
  const firstDay = startOfLocalDay(start);
  const lastDay = startOfLocalDay(end);
  const dayCount = Math.min(
    Math.round((lastDay.getTime() - firstDay.getTime()) / MS_PER_DAY) + 1,
    366,
  );
  const startTime = timeOfDayMin(t.startAt);
  const endTime = timeOfDayMin(t.endAt);

  for (let i = 0; i < dayCount; i++) {
    const day = new Date(firstDay.getTime() + i * MS_PER_DAY);
    if (t.recurUntil && day > t.recurUntil) break;
    if (day.getTime() + MS_PER_DAY <= t.startAt.getTime()) continue;
    if (!t.recurDays.includes(day.getDay())) continue;
    if (t.allDay) return true;
    // Build today's blocked window and check overlap with [start, end].
    const blockStart = new Date(day.getTime() + startTime * 60 * 1000);
    const blockEnd = new Date(day.getTime() + endTime * 60 * 1000);
    if (blockStart < end && blockEnd > start) return true;
  }
  return false;
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function timeOfDayMin(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/** Expand TimeOff rows that fall within [windowStart, windowEnd] into a flat
 * list of concrete blocks for rendering on the admin calendar. */
export function expandTimeOffForRange(
  rows: TimeOff[],
  windowStart: Date,
  windowEnd: Date,
): Array<{ id: string; start: Date; end: Date; allDay: boolean; reason: string | null; recurring: boolean }> {
  const out: Array<{ id: string; start: Date; end: Date; allDay: boolean; reason: string | null; recurring: boolean }> = [];
  for (const t of rows) {
    if (t.recurrence === "NONE") {
      if (t.endAt <= windowStart || t.startAt >= windowEnd) continue;
      out.push({
        id: t.id,
        start: t.startAt,
        end: t.endAt,
        allDay: t.allDay,
        reason: t.reason,
        recurring: false,
      });
      continue;
    }
    if (t.recurDays.length === 0) continue;
    const firstDay = startOfLocalDay(new Date(Math.max(t.startAt.getTime(), windowStart.getTime())));
    const lastDay = startOfLocalDay(new Date(Math.min(
      t.recurUntil?.getTime() ?? windowEnd.getTime(),
      windowEnd.getTime(),
    )));
    if (lastDay < firstDay) continue;
    const dayCount = Math.round((lastDay.getTime() - firstDay.getTime()) / MS_PER_DAY) + 1;
    const startTime = timeOfDayMin(t.startAt);
    const endTime = timeOfDayMin(t.endAt);
    for (let i = 0; i < dayCount; i++) {
      const day = new Date(firstDay.getTime() + i * MS_PER_DAY);
      if (!t.recurDays.includes(day.getDay())) continue;
      out.push({
        id: `${t.id}-${day.toISOString().slice(0, 10)}`,
        start: t.allDay ? day : new Date(day.getTime() + startTime * 60 * 1000),
        end: t.allDay
          ? new Date(day.getTime() + MS_PER_DAY)
          : new Date(day.getTime() + endTime * 60 * 1000),
        allDay: t.allDay,
        reason: t.reason,
        recurring: true,
      });
    }
  }
  return out;
}
