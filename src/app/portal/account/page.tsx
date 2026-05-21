"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, CheckCircle } from "lucide-react";

export default function AccountPage() {
  const { data: session, update } = useSession();
  const [form, setForm] = useState({
    name: session?.user?.name ?? "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/portal/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          currentPassword: form.currentPassword || undefined,
          newPassword: form.newPassword || undefined,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Update failed");

      await update({ name: form.name });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-brand-orange-700">Account Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Update your profile and password</p>
      </div>

      <div className="bg-white p-6">
        <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
          <div>
            <p className="label">Email</p>
            <p className="text-sm text-gray-600 bg-gray-50 px-4 py-3 border border-gray-100">
              {session?.user?.email}
            </p>
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="label" htmlFor="acc-name">Full Name</label>
            <input
              id="acc-name"
              className="input-field"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="label" htmlFor="acc-phone">Phone</label>
            <input
              id="acc-phone"
              type="tel"
              className="input-field"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>

          <hr className="border-gray-100" />
          <p className="font-sans text-xs uppercase tracking-wider text-gray-400">Change Password</p>

          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              className="input-field"
              value={form.currentPassword}
              onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              className="input-field"
              value={form.newPassword}
              onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              className="input-field"
              value={form.confirmPassword}
              onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3">{error}</p>
          )}

          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : null}
            {saved ? "Saved!" : saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
