"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(key: string, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, password: form.password }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Registration failed");

      // Auto sign-in
      await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      router.push("/portal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <div className="font-serif text-2xl tracking-[0.2em] text-brand-green-700">THE WILD FLOWER</div>
            <div className="font-sans text-xs tracking-[0.5em] uppercase text-brand-gold-500 mt-1">VAULT</div>
          </Link>
          <h1 className="font-serif text-3xl text-brand-green-700 mt-6">Create Account</h1>
          <p className="text-sm text-gray-400 mt-2">Manage your bookings in one place</p>
        </div>
        <div className="bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input required className="input-field" value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" required className="input-field" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="tel" className="input-field" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div>
              <label className="label">Password * (min 8 chars)</label>
              <input type="password" required minLength={8} className="input-field" value={form.password} onChange={(e) => update("password", e.target.value)} />
            </div>
            <div>
              <label className="label">Confirm Password *</label>
              <input type="password" required className="input-field" value={form.confirm} onChange={(e) => update("confirm", e.target.value)} />
            </div>

            {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{" "}
            <Link href="/portal/auth/signin" className="text-brand-green-700 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
