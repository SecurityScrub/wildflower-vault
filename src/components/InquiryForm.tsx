"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id: string) => void;
    };
  }
}

const EVENT_TYPES = [
  "Wedding",
  "Engagement Party",
  "Bridal Shower",
  "Baby Shower",
  "Birthday Party",
  "Corporate Event",
  "Other",
];

const RENTAL_OPTIONS = [
  "Flower Wall",
  "Photo Booth",
  "Backdrop",
  "Arch / Arbor",
  "Not sure yet",
];

export function InquiryForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    eventDate: "",
    eventType: "",
    items: [] as string[],
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>("");

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

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
    return () => { document.head.removeChild(script); };
  }, [siteKey]);

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleItem(item: string) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.includes(item)
        ? prev.items.filter((i) => i !== item)
        : [...prev.items, item],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (siteKey && !turnstileToken) {
      setError("Please complete the security check.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, turnstileToken }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
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
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-brand-green-700 text-2xl">✓</span>
        </div>
        <h2 className="font-serif text-3xl text-brand-green-700 mb-3">Message Sent!</h2>
        <p className="font-sans text-sm text-gray-500 max-w-sm mx-auto">
          Thank you for reaching out, {form.name}. We&apos;ll be in touch within 24–48 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="label" htmlFor="inq-name">Your Name *</label>
          <input
            id="inq-name"
            required
            className="input-field"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="inq-email">Email *</label>
          <input
            id="inq-email"
            type="email"
            required
            className="input-field"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="inq-phone">Phone</label>
          <input
            id="inq-phone"
            type="tel"
            className="input-field"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="inq-date">Event Date (if known)</label>
          <input
            id="inq-date"
            type="date"
            className="input-field"
            value={form.eventDate}
            onChange={(e) => updateField("eventDate", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="inq-type">Event Type</label>
          <select
            id="inq-type"
            className="input-field"
            value={form.eventType}
            onChange={(e) => updateField("eventType", e.target.value)}
          >
            <option value="">Select type…</option>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div>
        <p className="label mb-3">Items you&apos;re interested in</p>
        <div className="flex flex-wrap gap-2">
          {RENTAL_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleItem(item)}
              className={`px-4 py-2 font-sans text-xs tracking-wider uppercase border transition-colors ${
                form.items.includes(item)
                  ? "bg-brand-green-700 text-white border-brand-green-700"
                  : "border-gray-200 text-gray-500 hover:border-brand-green-700 hover:text-brand-green-700"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="inq-message">Message *</label>
        <textarea
          id="inq-message"
          required
          rows={5}
          className="input-field resize-none"
          placeholder="Tell us about your event, vision, and any questions you have…"
          value={form.message}
          onChange={(e) => updateField("message", e.target.value)}
        />
      </div>

      {/* Cloudflare Turnstile */}
      {siteKey && <div ref={turnstileRef} />}

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        {loading ? "Sending…" : "Send Inquiry"}
      </button>

      <p className="text-center font-sans text-xs text-gray-400">
        We respond within 24–48 hours · No spam, ever
      </p>
    </form>
  );
}
