"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Plus, Edit2, Eye, EyeOff, Star, Upload, X, GripVertical } from "lucide-react";
import type { RentalItem } from "@prisma/client";

interface RentalWithCount extends RentalItem {
  _count: { bookingItems: number };
}

function ImageUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!imageFiles.length) return;

    setUploading(true);
    const formData = new FormData();
    imageFiles.forEach((f) => formData.append("files", f));

    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { urls?: string[]; error?: string };
      if (data.urls) {
        onChange([...images, ...data.urls]);
      }
    } finally {
      setUploading(false);
    }
  }, [images, onChange]);

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function moveImage(from: number, to: number) {
    if (to < 0 || to >= images.length) return;
    const updated = [...images];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onChange(updated);
  }

  return (
    <div>
      <label className="label">Photos</label>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {images.map((url, i) => (
            <div key={url} className="relative group aspect-square bg-gray-100">
              <Image
                src={url}
                alt={`Image ${i + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
              <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(i, i - 1)}
                    className="bg-white/90 text-gray-700 rounded px-1 py-0.5 text-[10px] font-bold"
                  >
                    &larr;
                  </button>
                )}
                {i < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(i, i + 1)}
                    className="bg-white/90 text-gray-700 rounded px-1 py-0.5 text-[10px] font-bold"
                  >
                    &rarr;
                  </button>
                )}
              </div>
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-brand-orange-700 text-white text-[9px] px-1.5 py-0.5 uppercase tracking-wider font-bold">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-brand-orange-500 bg-brand-orange-50"
            : "border-gray-200 hover:border-brand-orange-300"
        }`}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.multiple = true;
          input.accept = "image/*";
          input.onchange = () => { if (input.files) uploadFiles(input.files); };
          input.click();
        }}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-brand-orange-600">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Uploading...</span>
          </div>
        ) : (
          <>
            <Upload size={20} className="mx-auto text-gray-400 mb-1" />
            <p className="text-sm text-gray-500">Drag & drop images or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP up to 10MB</p>
          </>
        )}
      </div>
    </div>
  );
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
        images: Array.isArray(editing.images) ? editing.images : [],
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
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-orange-700" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-brand-orange-700">Rentals</h1>
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
                        <Image src={rental.images[0]} alt={rental.name} fill className="object-cover" unoptimized />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-brand-orange-100 flex items-center justify-center shrink-0">
                        <span className="text-brand-orange-400 text-xs">img</span>
                      </div>
                    )}
                    <div>
                      <p className="font-sans text-sm font-medium">{rental.name}</p>
                      <p className="font-sans text-xs text-gray-400">{rental.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 font-sans text-sm text-gray-500">{rental.category}</td>
                <td className="px-4 py-4 font-sans text-sm text-brand-pink-600 font-semibold">
                  {formatCurrency(Number(rental.price))}
                </td>
                <td className="px-4 py-4 font-sans text-sm">{rental._count.bookingItems}</td>
                <td className="px-4 py-4">
                  <button onClick={() => toggleFeatured(rental.id, rental.isFeatured)}>
                    <Star size={16} className={rental.isFeatured ? "fill-brand-pink-500 text-brand-pink-500" : "text-gray-300"} />
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
                    className="text-brand-orange-700 hover:text-brand-pink-500"
                  >
                    <Edit2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit / Create panel */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-end" onClick={() => setEditing(null)}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl text-brand-orange-700">
                {editing.id ? "Edit Rental" : "New Rental"}
              </h2>
              <button onClick={() => setEditing(null)} className="text-gray-400">&#x2715;</button>
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

              <ImageUploader
                images={Array.isArray(editing.images) ? editing.images : []}
                onChange={(imgs) => setEditing((p) => ({ ...p!, images: imgs }))}
              />

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
                  {saving ? "Saving..." : "Save"}
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
