"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Plus, Edit2, Eye, EyeOff, Star } from "lucide-react";
import type { RentalItem } from "@prisma/client";

interface RentalWithCount extends RentalItem {
  _count: { bookingItems: number };
}

export default function AdminRentalsPage() {
  const [rentals, setRentals] = useState<RentalWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<RentalItem> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/rentals")
      .then((r) => r.json() as Promise<RentalWithCount[]>)
      .then((d) => { setRentals(d); setLoading(false); });
  }, []);

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/admin/rentals?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    setRentals((prev) => prev.map((r) => r.id === id ? { ...r, isActive: !current } : r));
  }

  async function toggleFeatured(id: string, current: boolean) {
    await fetch(`/api/admin/rentals?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: !current }),
    });
    setRentals((prev) => prev.map((r) => r.id === id ? { ...r, isFeatured: !current } : r));
  }

  async function saveRental() {
    if (!editing) return;
    setSaving(true);
    const isNew = !editing.id;
    const url = isNew ? "/api/admin/rentals" : `/api/admin/rentals?id=${editing.id}`;
    const method = isNew ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editing,
        price: Number(editing.price),
        features: typeof editing.features === "string"
          ? (editing.features as string).split("\n").filter(Boolean)
          : editing.features,
        images: typeof editing.images === "string"
          ? (editing.images as string).split("\n").filter(Boolean)
          : editing.images,
      }),
    });

    const saved = await res.json() as RentalWithCount;
    if (isNew) {
      setRentals((prev) => [{ ...saved, _count: { bookingItems: 0 } }, ...prev]);
    } else {
      setRentals((prev) => prev.map((r) => r.id === saved.id ? { ...saved, _count: r._count } : r));
    }
    setSaving(false);
    setEditing(null);
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-green-700" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-brand-green-700">Rentals</h1>
        <button
          onClick={() => setEditing({ isActive: true, isFeatured: false, depositPct: 50, category: "general", features: [], images: [], sortOrder: 0 })}
          className="btn-primary py-2.5 px-5 text-xs flex items-center gap-2"
        >
          <Plus size={14} /> New Rental
        </button>
      </div>

      <div className="bg-white overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Item", "Category", "Price", "Bookings", "Featured", "Active", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-sans text-xs uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rentals.map((rental) => (
              <tr key={rental.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    {rental.images[0] ? (
                      <div className="w-10 h-10 relative overflow-hidden shrink-0">
                        <Image src={rental.images[0]} alt={rental.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-brand-green-100 flex items-center justify-center shrink-0">
                        <span className="text-brand-green-400 text-xs">img</span>
                      </div>
                    )}
                    <div>
                      <p className="font-sans text-sm font-medium">{rental.name}</p>
                      <p className="font-sans text-xs text-gray-400">{rental.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 font-sans text-sm text-gray-500">{rental.category}</td>
                <td className="px-4 py-4 font-sans text-sm text-brand-gold-600 font-semibold">
                  {formatCurrency(Number(rental.price))}
                </td>
                <td className="px-4 py-4 font-sans text-sm">{rental._count.bookingItems}</td>
                <td className="px-4 py-4">
                  <button onClick={() => toggleFeatured(rental.id, rental.isFeatured)}>
                    <Star size={16} className={rental.isFeatured ? "fill-brand-gold-500 text-brand-gold-500" : "text-gray-300"} />
                  </button>
                </td>
                <td className="px-4 py-4">
                  <button onClick={() => toggleActive(rental.id, rental.isActive)}>
                    {rental.isActive
                      ? <Eye size={16} className="text-green-500" />
                      : <EyeOff size={16} className="text-gray-300" />}
                  </button>
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => setEditing({ ...rental, features: rental.features, images: rental.images })}
                    className="text-brand-green-700 hover:text-brand-gold-500"
                  >
                    <Edit2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit / Create modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-end" onClick={() => setEditing(null)}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl text-brand-green-700">
                {editing.id ? "Edit Rental" : "New Rental"}
              </h2>
              <button onClick={() => setEditing(null)} className="text-gray-400">✕</button>
            </div>

            <div className="space-y-4">
              {[
                { key: "name", label: "Name *" },
                { key: "tagline", label: "Tagline" },
                { key: "category", label: "Category" },
                { key: "price", label: "Price ($)", type: "number" },
                { key: "depositPct", label: "Deposit %", type: "number" },
                { key: "dimensions", label: "Dimensions" },
                { key: "capacity", label: "Capacity" },
                { key: "sortOrder", label: "Sort Order", type: "number" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  <input
                    type={f.type ?? "text"}
                    className="input-field"
                    value={(editing as Record<string, unknown>)[f.key]?.toString() ?? ""}
                    onChange={(e) => setEditing((p) => ({ ...p!, [f.key]: e.target.value } as Partial<RentalItem>))}
                  />
                </div>
              ))}

              <div>
                <label className="label">Description *</label>
                <textarea rows={3} className="input-field resize-none"
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing((p) => ({ ...p!, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Long Description</label>
                <textarea rows={4} className="input-field resize-none"
                  value={editing.longDesc ?? ""}
                  onChange={(e) => setEditing((p) => ({ ...p!, longDesc: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Features (one per line)</label>
                <textarea rows={4} className="input-field resize-none font-mono text-xs"
                  value={Array.isArray(editing.features) ? editing.features.join("\n") : ((editing.features as unknown as string) ?? "")}
                  onChange={(e) => setEditing((p) => ({ ...p!, features: e.target.value as unknown as string[] }))}
                />
              </div>
              <div>
                <label className="label">Image URLs (one per line)</label>
                <textarea rows={4} className="input-field resize-none font-mono text-xs"
                  placeholder="https://…"
                  value={Array.isArray(editing.images) ? editing.images.join("\n") : ((editing.images as unknown as string) ?? "")}
                  onChange={(e) => setEditing((p) => ({ ...p!, images: e.target.value as unknown as string[] }))}
                />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.isActive ?? true}
                    onChange={(e) => setEditing((p) => ({ ...p!, isActive: e.target.checked }))} />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.isFeatured ?? false}
                    onChange={(e) => setEditing((p) => ({ ...p!, isFeatured: e.target.checked }))} />
                  Featured on homepage
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={saveRental} disabled={saving} className="btn-primary flex items-center gap-2">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  {saving ? "Saving…" : "Save"}
                </button>
                <button onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
