"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { Loader2, Search, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import type { BookingWithItems } from "@/types";

const STATUSES = ["ALL", "PENDING", "CONFIRMED", "DEPOSIT_PAID", "PAID", "CANCELLED", "COMPLETED"];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  DEPOSIT_PAID: "bg-indigo-100 text-indigo-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  COMPLETED: "bg-gray-100 text-gray-800",
};

interface BookingListResponse {
  bookings: BookingWithItems[];
  total: number;
  pages: number;
}

export default function AdminOrdersPage() {
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<BookingListResponse>({ bookings: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithItems | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: "15" });
    if (status !== "ALL") params.set("status", status);
    const res = await fetch(`/api/admin/bookings?${params}`);
    const json = await res.json() as BookingListResponse;
    setData(json);
    setLoading(false);
  }, [status, page]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  async function refreshFromSquare(id: string) {
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      const res = await fetch(`/api/admin/bookings/${id}/refresh-square`, { method: "POST" });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        booking?: { status: BookingWithItems["status"]; paidAmount: string | number };
        summary?: { paidAmount: number; totalAmount: number; isFullyPaid: boolean };
      };
      if (!res.ok || !data.ok || !data.booking) {
        setRefreshMsg({ ok: false, text: data.error ?? "Square refresh failed." });
        return;
      }
      await fetchBookings();
      const paid = data.summary?.paidAmount ?? Number(data.booking.paidAmount);
      const total = data.summary?.totalAmount ?? Number(selectedBooking?.totalAmount ?? 0);
      setSelectedBooking((prev) =>
        prev?.id === id
          ? ({
              ...prev,
              status: data.booking!.status,
              // Server returns paidAmount as a string-or-number; cast through
              // unknown so it round-trips into the Prisma Decimal-typed field.
              paidAmount: data.booking!.paidAmount as unknown as BookingWithItems["paidAmount"],
            } as BookingWithItems)
          : prev,
      );
      setRefreshMsg({
        ok: true,
        text: data.summary?.isFullyPaid
          ? `Paid in full: $${paid.toFixed(2)}.`
          : paid > 0
            ? `Partial: $${paid.toFixed(2)} of $${total.toFixed(2)}.`
            : "No payments recorded in Square yet.",
      });
    } catch (err) {
      setRefreshMsg({ ok: false, text: err instanceof Error ? err.message : "Network error" });
    } finally {
      setRefreshing(false);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    setUpdating(id);
    await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    await fetchBookings();
    setUpdating(null);
    if (selectedBooking?.id === id) {
      setSelectedBooking((prev) => prev ? { ...prev, status: newStatus as BookingWithItems["status"] } : null);
    }
  }

  const filtered = search
    ? data.bookings.filter(
        (b) =>
          b.guestName?.toLowerCase().includes(search.toLowerCase()) ||
          b.guestEmail?.toLowerCase().includes(search.toLowerCase()) ||
          b.bookingNumber.toLowerCase().includes(search.toLowerCase())
      )
    : data.bookings;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl sm:text-3xl text-brand-orange-700">Orders</h1>
        <span className="font-sans text-xs sm:text-sm text-gray-400">{data.total} total</span>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search by name, email, ref…"
            className="input-field pl-9 text-xs sm:text-sm w-full sm:max-w-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap pb-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`shrink-0 px-3 py-2 font-sans text-xs uppercase tracking-wider transition-colors ${
                status === s
                  ? "bg-brand-orange-700 text-white"
                  : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-brand-orange-700" size={32} />
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {filtered.length === 0 ? (
              <div className="bg-white p-8 text-center text-sm text-gray-400">No orders</div>
            ) : (
              filtered.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBooking(b)}
                  className="block w-full text-left bg-white p-4 active:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-semibold truncate">{b.guestName}</p>
                      <p className="font-sans text-[11px] text-gray-400 mt-0.5 truncate">
                        {b.guestEmail}
                      </p>
                    </div>
                    <span className={`shrink-0 font-sans text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status] ?? ""}`}>
                      {b.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-gray-500 truncate">
                    {b.items.map((i) => i.rentalItem.name).join(", ")}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                    <span className="font-sans text-[11px] text-gray-400 font-mono">
                      {b.bookingNumber}
                    </span>
                    <span className="font-sans text-xs text-gray-500">
                      {formatShortDate(b.eventDate)}
                    </span>
                    <span className="font-sans text-sm font-semibold text-brand-pink-600">
                      {formatCurrency(Number(b.totalAmount))}
                    </span>
                  </div>
                </button>
              ))
            )}
            {data.pages > 1 && (
              <div className="flex items-center justify-between px-1 py-2">
                <span className="text-xs text-gray-400">
                  Page {page} of {data.pages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 disabled:opacity-40"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page === data.pages}
                    className="p-2 disabled:opacity-40"
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Ref #", "Customer", "Items", "Event Date", "Total", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-sans text-xs uppercase tracking-wider text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedBooking(b)}>
                    <td className="px-4 py-4 font-sans text-xs text-brand-orange-700 font-mono">
                      {b.bookingNumber}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-sans text-sm font-medium">{b.guestName}</p>
                      <p className="font-sans text-xs text-gray-400">{b.guestEmail}</p>
                    </td>
                    <td className="px-4 py-4 font-sans text-sm text-gray-600">
                      {b.items.map((i) => i.rentalItem.name).join(", ")}
                    </td>
                    <td className="px-4 py-4 font-sans text-sm">
                      {formatShortDate(b.eventDate)}
                    </td>
                    <td className="px-4 py-4 font-sans text-sm font-semibold text-brand-pink-600">
                      {formatCurrency(Number(b.totalAmount))}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`font-sans text-xs px-2.5 py-1 rounded-full ${STATUS_COLORS[b.status] ?? ""}`}>
                        {b.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      {updating === b.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <select
                          className="font-sans text-xs border border-gray-200 px-2 py-1"
                          value={b.status}
                          onChange={(e) => updateStatus(b.id, e.target.value)}
                        >
                          {["PENDING", "CONFIRMED", "DEPOSIT_PAID", "PAID", "CANCELLED", "COMPLETED"].map((s) => (
                            <option key={s} value={s}>{s.replace("_", " ")}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  Page {page} of {data.pages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1 disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page === data.pages}
                    className="p-1 disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Detail panel */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-end" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white w-full max-w-md h-full overflow-y-auto p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5 sm:mb-6">
              <div className="min-w-0">
                <p className="font-sans text-xs text-gray-400">#{selectedBooking.bookingNumber}</p>
                <h2 className="font-serif text-xl sm:text-2xl text-brand-orange-700 mt-1 break-words">
                  {selectedBooking.guestName}
                </h2>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-gray-600 p-2 -m-2 -mr-2 shrink-0 text-lg"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {(selectedBooking.guestEmail || selectedBooking.guestPhone) && (
              <div className="flex gap-2 mb-5 sm:hidden">
                {selectedBooking.guestEmail && (
                  <a
                    href={`mailto:${selectedBooking.guestEmail}`}
                    className="flex-1 text-center bg-brand-orange-700 text-white text-xs font-sans py-2.5 rounded"
                  >
                    Email
                  </a>
                )}
                {selectedBooking.guestPhone && (
                  <a
                    href={`tel:${selectedBooking.guestPhone}`}
                    className="flex-1 text-center bg-brand-pink-500 text-white text-xs font-sans py-2.5 rounded"
                  >
                    Call
                  </a>
                )}
              </div>
            )}

            <div className="space-y-4 text-sm">
              {[
                ["Email", selectedBooking.guestEmail],
                ["Phone", selectedBooking.guestPhone],
                ["Event Date", formatShortDate(selectedBooking.eventDate)],
                ["Event Type", selectedBooking.eventType],
                ["Venue", [selectedBooking.venueName, selectedBooking.venueCity, selectedBooking.venueState].filter(Boolean).join(", ")],
                ["Guest Count", selectedBooking.guestCount?.toString()],
                ["Total", formatCurrency(Number(selectedBooking.totalAmount))],
                ["Deposit", formatCurrency(Number(selectedBooking.depositAmount ?? 0))],
                ["Paid", formatCurrency(Number(selectedBooking.paidAmount))],
                ["Square Order", selectedBooking.squareOrderId],
              ].map(([label, val]) => val ? (
                <div key={label} className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-medium">{val}</span>
                </div>
              ) : null)}
            </div>

            <div className="mt-4">
              <h3 className="font-sans text-xs uppercase tracking-wider text-gray-400 mb-2">Items</h3>
              {selectedBooking.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-2 border-b border-gray-50">
                  <span>{item.rentalItem.name} × {item.quantity}</span>
                  <span className="text-brand-pink-600">{formatCurrency(Number(item.price))}</span>
                </div>
              ))}
            </div>

            {selectedBooking.notes && (
              <div className="mt-4 bg-gray-50 p-3 text-xs text-gray-600">
                <span className="font-medium">Customer Note: </span>{selectedBooking.notes}
              </div>
            )}

            {selectedBooking.squareOrderId && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => refreshFromSquare(selectedBooking.id)}
                  disabled={refreshing}
                  className="w-full flex items-center justify-center gap-2 border border-brand-orange-700 text-brand-orange-700 hover:bg-brand-orange-50 py-2.5 text-xs font-sans uppercase tracking-wider rounded-none disabled:opacity-60"
                >
                  {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  {refreshing ? "Checking Square…" : "Refresh from Square"}
                </button>
                {refreshMsg && (
                  <p
                    className={`mt-2 text-xs px-3 py-2 ${
                      refreshMsg.ok
                        ? "bg-green-50 text-green-800 border border-green-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {refreshMsg.text}
                  </p>
                )}
              </div>
            )}

            <div className="mt-6">
              <label className="label">Update Status</label>
              <select
                className="input-field"
                value={selectedBooking.status}
                onChange={(e) => updateStatus(selectedBooking.id, e.target.value)}
              >
                {["PENDING", "CONFIRMED", "DEPOSIT_PAID", "PAID", "CANCELLED", "COMPLETED"].map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
