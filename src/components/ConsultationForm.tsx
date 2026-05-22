"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id: string) => void;
    };
  }
}

const LOCATION_OPTIONS = [
  "Phone (we'll call you)",
  "Video (Zoom — link sent before)",
  "In Person — Des Moines Studio",
];

// Tue–Sat 10am–6pm Central, 30-minute slots
const BUSINESS_DAYS = new Set([2, 3, 4, 5, 6]); // 0 = Sun
const SLOT_START_HOUR = 10;
const SLOT_END_HOUR = 18;

function generateAvailableSlots(daysAhead = 21): { date: string; slots: string[] }[] {
  const result: { date: string; slots: string[] }[] = [];
  const now = new Date();

  for (let offset = 1; offset <= daysAhead; offset++) {
    const day = new Date(now);
    day.setDate(now.getDate() + offset);
    if (!BUSINESS_DAYS.has(day.getDay())) continue;

    const dateLabel = day.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const slots: string[] = [];
    for (let hour = SLOT_START_HOUR; hour < SLOT_END_HOUR; hour++) {
      for (const min of [0, 30]) {
        const slot = new Date(day);
        slot.setHours(hour, min, 0, 0);
        slots.push(slot.toISOString());
      }
    }
    result.push({ date: dateLabel, slots });
  }
  return result;
}

export function ConsultationForm({
  defaultName = "",
  defaultEmail = "",
  defaultPartnerName = "",
  defaultPhone = "",
  leadId,
}: {
  defaultName?: string;
  defaultEmail?: string;
  defaultPartnerName?: string;
  defaultPhone?: string;
  leadId?: string;
}) {
  const [name, setName] = useState(defaultName);
  const [partnerName, setPartnerName] = useState(defaultPartnerName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState(defaultPhone);
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [location, setLocation] = useState(LOCATION_OPTIONS[0]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>("");

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const days = useMemo(() => generateAvailableSlots(21), []);

  useEffect(() => {
    if (!siteKey || !turnstileRef.current) return;
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.turnstile && turnstileRef.current) {
        widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey: siteKey,
          callback: (token: string) => setTurnstileToken(token),
          "expired-callback": () => setTurnstileToken(""),
        });
      }
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [siteKey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduledAt) {
      setError("Please pick a time.");
      return;
    }
    if (siteKey && !turnstileToken) {
      setError("Please complete the security check.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          partnerName: partnerName || null,
          email,
          phone: phone || null,
          scheduledAt,
          location,
          notes: notes || null,
          leadId,
          turnstileToken,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not book the consultation");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        setTurnstileToken("");
      }
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    const when = new Date(scheduledAt).toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-brand-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-brand-pink-600 text-2xl">&#10003;</span>
        </div>
        <h2 className="font-serif text-3xl text-brand-orange-700 mb-3">
          Consultation booked!
        </h2>
        <p className="font-sans text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
          We&apos;ve scheduled your consultation for <strong>{when}</strong>.
          A confirmation email with a calendar invite is on its way to <strong>{email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="label" htmlFor="cs-name">Your Name *</label>
          <input id="cs-name" required className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="cs-partner">Partner&apos;s Name</label>
          <input id="cs-partner" className="input-field" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="cs-email">Email *</label>
          <input id="cs-email" type="email" required className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="cs-phone">Phone</label>
          <input id="cs-phone" type="tel" className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Where should we meet?</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
          {LOCATION_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setLocation(opt)}
              className={`px-3 py-2 font-sans text-xs tracking-wider uppercase border transition-colors ${
                location === opt
                  ? "bg-brand-orange-700 text-white border-brand-orange-700"
                  : "border-gray-200 text-gray-500 hover:border-brand-orange-500 hover:text-brand-orange-500"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Pick a time (Tue–Sat, 10am–6pm Central)</label>
        <div className="max-h-72 overflow-y-auto border border-gray-200 rounded p-3 space-y-3 mt-2">
          {days.map((d) => (
            <div key={d.date}>
              <p className="font-sans text-xs font-semibold text-gray-500 mb-2">{d.date}</p>
              <div className="flex flex-wrap gap-1.5">
                {d.slots.map((slot) => {
                  const slotTime = new Date(slot).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  });
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setScheduledAt(slot)}
                      className={`text-xs font-sans px-2.5 py-1 rounded border ${
                        scheduledAt === slot
                          ? "bg-brand-pink-500 text-white border-brand-pink-500"
                          : "border-gray-200 text-gray-600 hover:border-brand-pink-500"
                      }`}
                    >
                      {slotTime}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="cs-notes">Anything you&apos;d like us to know? (optional)</label>
        <textarea
          id="cs-notes"
          rows={3}
          className="input-field resize-none"
          placeholder="Vibe, must-haves, big questions for the call…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {siteKey && <div ref={turnstileRef} />}

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        {loading ? "Booking…" : "Confirm consultation"}
      </button>

      <p className="text-center font-sans text-xs text-gray-400">
        Free, no obligation &middot; Calendar invite sent to your email
      </p>
    </form>
  );
}
