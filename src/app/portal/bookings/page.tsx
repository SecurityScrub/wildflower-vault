"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { Loader2, X } from "lucide-react";
import type { BookingWithItems } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  DEPOSIT_PAID: "bg-indigo-100 text-indigo-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-gray-100 text-gray-800",
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<BookingWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/bookings")
      .then((r) => r.json() as Promise<BookingWithItems[]>)
      .then(setBookings)
      .finally(() => setLoading(false));
  }, []);

  async function cancelBooking(id: string) {
    if (!confirm("Cancel this booking? This cannot be undone.")) return;
    setCancelling(id);
    setError("");
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to cancel");
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "CANCELLED" as const } : b))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
    } finally {
      setCancelling(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-brand-green-700" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-brand-green-700">My Bookings</h1>
        <p className="text-sm text-gray-400 mt-1">{bookings.length} booking{bookings.length !== 1 ? "s" : ""} total</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="bg-white p-12 text-center">
          <p className="font-serif text-xl text-brand-green-700 mb-3">No bookings yet</p>
          <p className="text-sm text-gray-400 mb-6">Ready to plan your event?</p>
          <a href="/book" className="btn-primary">Book a Rental</a>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const canCancel =
              booking.status !== "CANCELLED" &&
              booking.status !== "COMPLETED" &&
              booking.status !== "PAID";

            return (
              <div key={booking.id} className="bg-white p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-sans font-semibold text-sm text-brand-green-700">
                      #{booking.bookingNumber}
                    </p>
                    <p className="font-serif text-xl text-brand-green-700 mt-1">
                      {booking.items.map((i) => i.rentalItem.name).join(", ")}
                    </p>
                  </div>
                  <span
                    className={`font-sans text-xs px-2.5 py-1 rounded-full ${
                      STATUS_COLORS[booking.status] ?? "bg-gray-100"
                    }`}
                  >
                    {booking.status.replace("_", " ")}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-xs text-gray-400">Event Date</p>
                    <p className="font-medium text-brand-green-700 mt-0.5">
                      {formatShortDate(booking.eventDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Venue</p>
                    <p className="font-medium mt-0.5">{booking.venueName ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="font-medium text-brand-gold-600 mt-0.5">
                      {formatCurrency(Number(booking.totalAmount))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Paid</p>
                    <p className="font-medium mt-0.5">
                      {formatCurrency(Number(booking.paidAmount))}
                    </p>
                  </div>
                </div>

                {booking.notes && (
                  <p className="text-xs text-gray-400 border-t border-gray-50 pt-3 mt-3">
                    Note: {booking.notes}
                  </p>
                )}

                {canCancel && (
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <button
                      onClick={() => cancelBooking(booking.id)}
                      disabled={cancelling === booking.id}
                      className="flex items-center gap-2 font-sans text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      {cancelling === booking.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <X size={12} />
                      )}
                      Cancel Booking
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
