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

const PLANNING_TYPES = [
  "Full-Service Planning",
  "Partial Planning",
  "Month-Of Coordination",
  "Day-Of Coordination",
  "Not sure yet",
];

const BUDGET_RANGES = [
  "Under $10,000",
  "$10,000 – $20,000",
  "$20,000 – $35,000",
  "$35,000 – $50,000",
  "$50,000+",
  "Prefer not to say",
];

const SERVICE_OPTIONS = [
  "Venue selection",
  "Vendor coordination",
  "Floral & decor",
  "Rental pieces",
  "Timeline & logistics",
  "Day-of direction",
  "Rehearsal coordination",
  "Guest management",
];

const REFERRAL_SOURCES = [
  "Instagram",
  "Facebook",
  "Google search",
  "Friend or family",
  "Vendor referral",
  "Wedding wire / The Knot",
  "Other",
];

interface FormState {
  name: string;
  partnerName: string;
  email: string;
  phone: string;
  weddingDate: string;
  flexibleDate: boolean;
  guestCount: string;
  venue: string;
  budget: string;
  planningType: string;
  servicesNeeded: string[];
  hearAboutUs: string;
  message: string;
}

const INITIAL_STATE: FormState = {
  name: "",
  partnerName: "",
  email: "",
  phone: "",
  weddingDate: "",
  flexibleDate: false,
  guestCount: "",
  venue: "",
  budget: "",
  planningType: "",
  servicesNeeded: [],
  hearAboutUs: "",
  message: "",
};

export function WeddingPlanningForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
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

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleService(service: string) {
    setForm((prev) => ({
      ...prev,
      servicesNeeded: prev.servicesNeeded.includes(service)
        ? prev.servicesNeeded.filter((s) => s !== service)
        : [...prev.servicesNeeded, service],
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
      const payload = {
        name: form.name,
        partnerName: form.partnerName || null,
        email: form.email,
        phone: form.phone || null,
        weddingDate: form.weddingDate || null,
        flexibleDate: form.flexibleDate,
        guestCount: form.guestCount ? Number(form.guestCount) : null,
        venue: form.venue || null,
        budget: form.budget || null,
        planningType: form.planningType || null,
        servicesNeeded: form.servicesNeeded,
        hearAboutUs: form.hearAboutUs || null,
        message: form.message || null,
        turnstileToken,
      };

      const res = await fetch("/api/wedding-planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
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
        <div className="w-16 h-16 bg-brand-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-brand-pink-600 text-2xl">&#10003;</span>
        </div>
        <h2 className="font-serif text-3xl text-brand-orange-700 mb-3">
          Congrats &amp; thank you!
        </h2>
        <p className="font-sans text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
          We&apos;ve received your wedding planning inquiry, {form.name}.
          One of our planners will be in touch within 24&ndash;48 hours to set up your
          complimentary consultation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="label" htmlFor="wp-name">Your Name *</label>
          <input
            id="wp-name"
            required
            className="input-field"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="wp-partner">Partner&apos;s Name</label>
          <input
            id="wp-partner"
            className="input-field"
            value={form.partnerName}
            onChange={(e) => updateField("partnerName", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="wp-email">Email *</label>
          <input
            id="wp-email"
            type="email"
            required
            className="input-field"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="wp-phone">Phone</label>
          <input
            id="wp-phone"
            type="tel"
            className="input-field"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="wp-date">Wedding Date</label>
          <input
            id="wp-date"
            type="date"
            className="input-field"
            value={form.weddingDate}
            onChange={(e) => updateField("weddingDate", e.target.value)}
          />
          <label className="flex items-center gap-2 mt-2 font-sans text-xs text-gray-500">
            <input
              type="checkbox"
              checked={form.flexibleDate}
              onChange={(e) => updateField("flexibleDate", e.target.checked)}
            />
            My date is flexible or TBD
          </label>
        </div>
        <div>
          <label className="label" htmlFor="wp-guests">Estimated Guest Count</label>
          <input
            id="wp-guests"
            type="number"
            min={1}
            max={5000}
            className="input-field"
            value={form.guestCount}
            onChange={(e) => updateField("guestCount", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="wp-venue">Venue (if known)</label>
          <input
            id="wp-venue"
            className="input-field"
            placeholder="e.g. The Bricks Event Center, Des Moines"
            value={form.venue}
            onChange={(e) => updateField("venue", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="wp-budget">Estimated Budget</label>
          <select
            id="wp-budget"
            className="input-field"
            value={form.budget}
            onChange={(e) => updateField("budget", e.target.value)}
          >
            <option value="">Select a range…</option>
            {BUDGET_RANGES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="wp-planning">Planning Package</label>
          <select
            id="wp-planning"
            className="input-field"
            value={form.planningType}
            onChange={(e) => updateField("planningType", e.target.value)}
          >
            <option value="">Select a package…</option>
            {PLANNING_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div>
        <p className="label mb-3">What services are you most interested in?</p>
        <div className="flex flex-wrap gap-2">
          {SERVICE_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleService(item)}
              className={`px-4 py-2.5 font-sans text-xs tracking-wider uppercase border transition-colors ${
                form.servicesNeeded.includes(item)
                  ? "bg-brand-pink-500 text-white border-brand-pink-500"
                  : "border-gray-200 text-gray-500 hover:border-brand-pink-500 hover:text-brand-pink-500"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="wp-source">How did you hear about us?</label>
        <select
          id="wp-source"
          className="input-field"
          value={form.hearAboutUs}
          onChange={(e) => updateField("hearAboutUs", e.target.value)}
        >
          <option value="">Select an option…</option>
          {REFERRAL_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="wp-message">Tell us about your dream wedding</label>
        <textarea
          id="wp-message"
          rows={5}
          className="input-field resize-none"
          placeholder="Share your vision — style, colors, must-haves, anything we should know…"
          value={form.message}
          onChange={(e) => updateField("message", e.target.value)}
        />
      </div>

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
        {loading ? "Sending…" : "Request My Consultation"}
      </button>

      <p className="text-center font-sans text-xs text-gray-400">
        Free consultation &middot; We respond within 24&ndash;48 hours &middot; No spam, ever
      </p>
    </form>
  );
}
