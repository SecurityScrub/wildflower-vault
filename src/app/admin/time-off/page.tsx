"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Trash2, Calendar as CalIcon, Repeat } from "lucide-react";

type Recurrence = "NONE" | "WEEKLY" | "MONTHLY" | "YEARLY";

const ORDINAL = (n: number): string => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface TimeOffRow {
  id: string;
  reason: string | null;
  allDay: boolean;
  startAt: string;
  endAt: string;
  recurrence: Recurrence;
  recurDays: number[];
  recurUntil: string | null;
  createdAt: string;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function todayLocalDate(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function combineDateTime(date: string, time: string): string {
  // Returns an ISO string treating date+time as local.
  if (!date) return "";
  const dt = new Date(`${date}T${time || "00:00"}`);
  return dt.toISOString();
}

function formatRow(row: TimeOffRow): string {
  const start = new Date(row.startAt);
  const end = new Date(row.endAt);
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: start.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  };
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };
  const untilSuffix = row.recurUntil
    ? ` (until ${new Date(row.recurUntil).toLocaleDateString()})`
    : "";

  if (row.recurrence === "WEEKLY") {
    const days = row.recurDays.map((d) => DAY_LABELS[d]).join(", ");
    if (row.allDay) return `${days}, all day${untilSuffix}`;
    return `${days}, ${start.toLocaleTimeString("en-US", timeOpts)} – ${end.toLocaleTimeString("en-US", timeOpts)}${untilSuffix}`;
  }
  if (row.recurrence === "MONTHLY") {
    const day = ORDINAL(start.getDate());
    if (row.allDay) return `${day} of every month, all day${untilSuffix}`;
    return `${day} of every month, ${start.toLocaleTimeString("en-US", timeOpts)} – ${end.toLocaleTimeString("en-US", timeOpts)}${untilSuffix}`;
  }
  if (row.recurrence === "YEARLY") {
    const md = `${MONTHS[start.getMonth()]} ${start.getDate()}`;
    if (row.allDay) return `Every ${md}, all day${untilSuffix}`;
    return `Every ${md}, ${start.toLocaleTimeString("en-US", timeOpts)} – ${end.toLocaleTimeString("en-US", timeOpts)}${untilSuffix}`;
  }
  if (row.allDay) {
    return `${start.toLocaleDateString("en-US", opts)} → ${end.toLocaleDateString("en-US", opts)}`;
  }
  return `${start.toLocaleDateString("en-US", opts)} ${start.toLocaleTimeString("en-US", timeOpts)} – ${end.toLocaleDateString("en-US", opts) === start.toLocaleDateString("en-US", opts) ? end.toLocaleTimeString("en-US", timeOpts) : `${end.toLocaleDateString("en-US", opts)} ${end.toLocaleTimeString("en-US", timeOpts)}`}`;
}

export default function AdminTimeOffPage() {
  const [rows, setRows] = useState<TimeOffRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [reason, setReason] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [startDate, setStartDate] = useState(todayLocalDate());
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState(todayLocalDate());
  const [endTime, setEndTime] = useState("17:00");
  const [recurrence, setRecurrence] = useState<Recurrence>("NONE");
  const [recurDays, setRecurDays] = useState<number[]>([]);
  const [recurUntil, setRecurUntil] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/time-off");
    if (res.ok) {
      const data = (await res.json()) as TimeOffRow[];
      setRows(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  function toggleDay(d: number) {
    setRecurDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    let startAt: string;
    let endAt: string;
    if (allDay) {
      startAt = combineDateTime(startDate, "00:00");
      const endIso = new Date(`${endDate}T00:00`);
      endIso.setDate(endIso.getDate() + 1);
      endAt = endIso.toISOString();
    } else {
      startAt = combineDateTime(startDate, startTime);
      endAt = combineDateTime(endDate, endTime);
    }

    if (!startAt || !endAt) {
      setError("Please fill in the date(s).");
      return;
    }
    if (new Date(endAt) <= new Date(startAt)) {
      setError("End must be after start.");
      return;
    }
    if (recurrence === "WEEKLY" && recurDays.length === 0) {
      setError("Pick at least one weekday for a weekly block.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/admin/time-off", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: reason || null,
        allDay,
        startAt,
        endAt,
        recurrence,
        recurDays: recurrence === "WEEKLY" ? recurDays : [],
        recurUntil:
          recurrence !== "NONE" && recurUntil
            ? new Date(`${recurUntil}T23:59`).toISOString()
            : null,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not save.");
      return;
    }

    // Reset and refresh
    setReason("");
    setRecurDays([]);
    setRecurUntil("");
    setRecurrence("NONE");
    setAllDay(true);
    await refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this time-off block?")) return;
    await fetch(`/api/admin/time-off/${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-3xl">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-brand-orange-700">Time Off</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Block days or recurring windows when you&apos;re not available. Customers can&apos;t book rentals or consultations during these times.
        </p>
      </div>

      {/* Add form */}
      <form onSubmit={submit} className="bg-white p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2 text-brand-orange-700">
          <Plus size={16} />
          <h2 className="font-sans text-sm font-semibold uppercase tracking-wider">New Block</h2>
        </div>

        <div>
          <label className="label" htmlFor="to-reason">Reason (optional)</label>
          <input
            id="to-reason"
            type="text"
            className="input-field"
            placeholder="e.g. Family vacation, Sunday off, etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="w-4 h-4 accent-brand-orange-700"
          />
          <span className="text-sm">All-day</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="to-start-date">
              {recurrence === "NONE" ? "Start date" : "Recurrence starts"}
            </label>
            <input
              id="to-start-date"
              type="date"
              required
              className="input-field"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (!endDate || endDate < e.target.value) setEndDate(e.target.value);
              }}
            />
            {!allDay && (
              <input
                type="time"
                required
                className="input-field mt-2"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            )}
          </div>
          <div>
            <label className="label" htmlFor="to-end-date">
              {recurrence === "NONE" ? "End date" : "(time-of-day end)"}
            </label>
            {recurrence === "NONE" ? (
              <input
                id="to-end-date"
                type="date"
                required
                className="input-field"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            ) : (
              <div className="flex items-center h-[42px] text-xs text-gray-400">
                {allDay ? "Recurring blocks fire all day." : "Pick the end time below."}
              </div>
            )}
            {!allDay && (
              <input
                type="time"
                required
                className="input-field mt-2"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <p className="label flex items-center gap-1.5"><Repeat size={12} /> Recurrence</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {([
              ["NONE", "One-time"],
              ["WEEKLY", "Weekly"],
              ["MONTHLY", "Monthly"],
              ["YEARLY", "Yearly"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setRecurrence(value)}
                className={`px-3 py-2.5 text-xs font-sans uppercase tracking-wider rounded transition-colors ${
                  recurrence === value
                    ? "bg-brand-orange-700 text-white"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {recurrence === "WEEKLY" && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Repeat on</p>
              <div className="flex gap-1.5 flex-wrap mb-3">
                {DAY_LABELS.map((label, idx) => {
                  const active = recurDays.includes(idx);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`w-12 h-10 rounded text-xs font-sans font-medium transition-colors ${
                        active
                          ? "bg-brand-pink-500 text-white"
                          : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {recurrence === "MONTHLY" && startDate && (
            <p className="text-xs text-brand-orange-700 bg-brand-orange-50 px-3 py-2 rounded mb-3">
              Repeats on the <strong>{ORDINAL(new Date(`${startDate}T12:00`).getDate())}</strong> of every month. Months with fewer days are skipped.
            </p>
          )}

          {recurrence === "YEARLY" && startDate && (
            <p className="text-xs text-brand-orange-700 bg-brand-orange-50 px-3 py-2 rounded mb-3">
              Repeats every <strong>{MONTHS[new Date(`${startDate}T12:00`).getMonth()]} {new Date(`${startDate}T12:00`).getDate()}</strong>.
            </p>
          )}

          {recurrence !== "NONE" && (
            <div>
              <label className="label" htmlFor="to-until">Until (optional)</label>
              <input
                id="to-until"
                type="date"
                className="input-field"
                value={recurUntil}
                onChange={(e) => setRecurUntil(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">Leave blank to repeat indefinitely.</p>
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {submitting ? "Saving…" : "Add Block"}
        </button>
      </form>

      {/* Existing rows */}
      <div className="bg-white">
        <div className="flex items-center gap-2 p-5 border-b border-gray-100">
          <CalIcon size={16} className="text-brand-orange-700" />
          <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-gray-700">
            Existing Blocks ({rows.length})
          </h2>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-orange-700" /></div>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No time-off blocks yet.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {rows.map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-3 p-4 sm:p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-sans text-sm font-medium">{row.reason || "Time off"}</p>
                    {row.recurrence === "WEEKLY" && (
                      <span className="inline-flex items-center gap-1 bg-brand-pink-100 text-brand-pink-700 text-[10px] sm:text-xs px-2 py-0.5 rounded">
                        <Repeat size={10} /> Weekly
                      </span>
                    )}
                    {row.allDay && (
                      <span className="bg-gray-100 text-gray-600 text-[10px] sm:text-xs px-2 py-0.5 rounded">All-day</span>
                    )}
                  </div>
                  <p className="font-sans text-xs text-gray-500 mt-0.5">{formatRow(row)}</p>
                </div>
                <button
                  onClick={() => remove(row.id)}
                  className="text-gray-300 hover:text-red-500 p-2 -m-2"
                  aria-label="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
