"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Minus, Plus, Loader2 } from "lucide-react";

interface RentalOption {
  id: string;
  name: string;
  price: number;
  depositPct: number;
  images: string[];
  category: string;
}

interface SelectedItem {
  rental: RentalOption;
  quantity: number;
}

interface Props {
  rentals: RentalOption[];
  preselectedId: string | null;
  preselectedDate: string | null;
}

const US_STATES = [
  "IA", "IL", "MN", "MO", "NE", "SD", "WI",
];

const EVENT_TYPES = [
  "Wedding",
  "Engagement Party",
  "Bridal Shower",
  "Baby Shower",
  "Birthday Party",
  "Corporate Event",
  "Other",
];

export function BookingForm({ rentals, preselectedId, preselectedDate }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Items
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>(() => {
    if (!preselectedId) return [];
    const rental = rentals.find((r) => r.id === preselectedId);
    return rental ? [{ rental, quantity: 1 }] : [];
  });

  // Step 2: Event details
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    eventDate: preselectedDate ?? "",
    eventType: "",
    venueName: "",
    venueAddress: "",
    venueCity: "",
    venueState: "IA",
    guestCount: "",
    notes: "",
  });

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addItem(rental: RentalOption) {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.rental.id === rental.id);
      if (existing) return prev.map((i) => i.rental.id === rental.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { rental, quantity: 1 }];
    });
  }

  function removeItem(id: string) {
    setSelectedItems((prev) => prev.filter((i) => i.rental.id !== id));
  }

  function adjustQty(id: string, delta: number) {
    setSelectedItems((prev) =>
      prev.map((i) =>
        i.rental.id === id
          ? { ...i, quantity: Math.max(1, i.quantity + delta) }
          : i
      )
    );
  }

  const subtotal = selectedItems.reduce((sum, i) => sum + i.rental.price * i.quantity, 0);
  const depositPct = selectedItems[0]?.rental.depositPct ?? 50;
  const deposit = Math.ceil((subtotal * depositPct) / 100);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: selectedItems.map((i) => ({
            rentalItemId: i.rental.id,
            quantity: i.quantity,
            price: i.rental.price,
            name: i.rental.name,
          })),
          totalAmount: subtotal,
          depositAmount: deposit,
        }),
      });

      const data = await res.json() as { bookingId?: string; checkoutUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        router.push(`/book/confirmation?id=${data.bookingId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      {/* Form */}
      <div className="lg:col-span-2">
        {/* Step indicator */}
        <div className="flex items-center gap-4 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-sans font-medium transition-colors ${
                  step >= s
                    ? "bg-brand-orange-700 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {s}
              </div>
              <span className={`font-sans text-xs uppercase tracking-wider ${step >= s ? "text-brand-orange-700" : "text-gray-400"}`}>
                {s === 1 ? "Select Items" : s === 2 ? "Event Details" : "Review"}
              </span>
              {s < 3 && <div className="w-8 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Select Items ── */}
        {step === 1 && (
          <div>
            <h2 className="font-serif text-2xl text-brand-orange-700 mb-6">Choose Your Rentals</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {rentals.map((rental) => {
                const isSelected = selectedItems.some((i) => i.rental.id === rental.id);
                return (
                  <div
                    key={rental.id}
                    onClick={() => !isSelected && addItem(rental)}
                    className={`relative p-4 border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-brand-orange-700 bg-brand-orange-50"
                        : "border-gray-100 hover:border-brand-orange-300 bg-white"
                    }`}
                  >
                    {rental.images[0] && (
                      <div className="relative aspect-video mb-3 overflow-hidden">
                        <Image src={rental.images[0]} alt={rental.name} fill className="object-cover" />
                      </div>
                    )}
                    <h3 className="font-serif text-base text-brand-orange-700">{rental.name}</h3>
                    <p className="font-sans text-sm text-brand-pink-600 mt-1">
                      {formatCurrency(rental.price)} / event
                    </p>
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-brand-orange-700 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={selectedItems.length === 0}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue with {selectedItems.length} Item{selectedItems.length !== 1 ? "s" : ""} →
            </button>
          </div>
        )}

        {/* ── Step 2: Event Details ── */}
        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
            <h2 className="font-serif text-2xl text-brand-orange-700 mb-6">Event Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="label" htmlFor="name">Full Name *</label>
                <input id="name" required className="input-field" value={form.name} onChange={(e) => updateField("name", e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="email">Email Address *</label>
                <input id="email" type="email" required className="input-field" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="phone">Phone *</label>
                <input id="phone" type="tel" required className="input-field" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="eventDate">Event Date *</label>
                <input
                  id="eventDate"
                  type="date"
                  required
                  className="input-field"
                  min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                  value={form.eventDate}
                  onChange={(e) => updateField("eventDate", e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="eventType">Event Type *</label>
                <select id="eventType" required className="input-field" value={form.eventType} onChange={(e) => updateField("eventType", e.target.value)}>
                  <option value="">Select type…</option>
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="guestCount">Guest Count (approx.)</label>
                <input id="guestCount" type="number" min="1" className="input-field" value={form.guestCount} onChange={(e) => updateField("guestCount", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="venueName">Venue Name *</label>
                <input id="venueName" required className="input-field" value={form.venueName} onChange={(e) => updateField("venueName", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="venueAddress">Venue Address *</label>
                <input id="venueAddress" required className="input-field" value={form.venueAddress} onChange={(e) => updateField("venueAddress", e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="venueCity">City *</label>
                <input id="venueCity" required className="input-field" value={form.venueCity} onChange={(e) => updateField("venueCity", e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="venueState">State</label>
                <select id="venueState" className="input-field" value={form.venueState} onChange={(e) => updateField("venueState", e.target.value)}>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="notes">Additional Notes</label>
                <textarea
                  id="notes"
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Setup time preferences, special requests…"
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                ← Back
              </button>
              <button type="submit" className="btn-primary">
                Review Order →
              </button>
            </div>
          </form>
        )}

        {/* ── Step 3: Review ── */}
        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <h2 className="font-serif text-2xl text-brand-orange-700 mb-6">Review Your Order</h2>

            <div className="bg-brand-cream p-6 mb-6 space-y-3">
              <h3 className="font-sans text-xs uppercase tracking-wider text-gray-500 mb-4">Event Details</h3>
              {[
                ["Name", form.name],
                ["Email", form.email],
                ["Phone", form.phone],
                ["Event Date", new Date(form.eventDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })],
                ["Event Type", form.eventType],
                ["Venue", `${form.venueName} · ${form.venueCity}, ${form.venueState}`],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-brand-orange-700 font-medium">{val}</span>
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm mb-6">
                {error}
              </div>
            )}

            <p className="text-sm text-gray-500 mb-6">
              You will be redirected to Square&apos;s secure checkout to pay your deposit of{" "}
              <strong className="text-brand-pink-600">{formatCurrency(deposit)}</strong>.
            </p>

            <div className="flex gap-4">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary">
                ← Back
              </button>
              <button type="submit" disabled={loading} className="btn-gold flex items-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? "Redirecting…" : `Pay Deposit · ${formatCurrency(deposit)}`}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Order Summary sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-brand-cream p-6 sticky top-28">
          <h3 className="font-sans text-xs uppercase tracking-wider text-gray-500 mb-5">
            Order Summary
          </h3>
          {selectedItems.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No items selected yet</p>
          ) : (
            <div className="space-y-4">
              {selectedItems.map((item) => (
                <div key={item.rental.id} className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm font-medium text-brand-orange-700 truncate">
                      {item.rental.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => adjustQty(item.rental.id, -1)}
                        className="w-5 h-5 flex items-center justify-center border border-gray-200 hover:bg-gray-100"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-xs">{item.quantity}</span>
                      <button
                        onClick={() => adjustQty(item.rental.id, 1)}
                        className="w-5 h-5 flex items-center justify-center border border-gray-200 hover:bg-gray-100"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-sans text-sm text-brand-pink-600">
                      {formatCurrency(item.rental.price * item.quantity)}
                    </p>
                    <button
                      onClick={() => removeItem(item.rental.id)}
                      className="text-xs text-gray-400 hover:text-red-500 mt-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-brand-pink-600">
                  <span>Deposit due today</span>
                  <span>{formatCurrency(deposit)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Balance due before event</span>
                  <span>{formatCurrency(subtotal - deposit)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>✓</span> Delivery & setup included
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>✓</span> Secure Square checkout
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>✓</span> Instant email confirmation
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
