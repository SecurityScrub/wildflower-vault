"use client";

import { useCallback, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { validatePassword, PASSWORD_POLICY } from "@/lib/password";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const onTurnstileToken = useCallback((t: string) => setTurnstileToken(t), []);

  function update(key: string, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  const passwordCheck = useMemo(() => validatePassword(form.password), [form.password]);
  const passwordsMatch = form.password.length > 0 && form.password === form.confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordCheck.valid) {
      setError(passwordCheck.errors.join(" "));
      return;
    }
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
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          turnstileToken,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Registration failed");

      // New customer accounts require MFA; route them through the regular sign-in flow.
      router.push(`/auth/signin?registered=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setLoading(false);
    }
  }

  // Avoid unused-import warnings while making the component self-documenting:
  void signIn;

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <div className="font-serif text-2xl tracking-[0.2em] text-brand-orange-700">THE WILD FLOWER</div>
            <div className="font-sans text-xs tracking-[0.5em] uppercase text-brand-pink-500 mt-1">VAULT</div>
          </Link>
          <h1 className="font-serif text-3xl text-brand-orange-700 mt-6">Create Account</h1>
          <p className="text-sm text-gray-400 mt-2">Manage your bookings and wedding planning in one place</p>
        </div>
        <div className="bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input required className="input-field" value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" required autoComplete="email" className="input-field" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="tel" autoComplete="tel" className="input-field" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div>
              <label className="label">Password *</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                minLength={PASSWORD_POLICY.minLength}
                className="input-field"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
              <ul className="mt-2 text-xs font-sans space-y-0.5">
                {([
                  { test: form.password.length >= PASSWORD_POLICY.minLength, label: `At least ${PASSWORD_POLICY.minLength} characters` },
                  { test: /[A-Z]/.test(form.password), label: "An uppercase letter" },
                  { test: /[a-z]/.test(form.password), label: "A lowercase letter" },
                  { test: /[0-9]/.test(form.password), label: "A number" },
                  { test: /[^A-Za-z0-9]/.test(form.password), label: "A symbol" },
                ]).map((c) => (
                  <li key={c.label} className={c.test ? "text-emerald-600" : "text-gray-400"}>
                    {c.test ? "✓" : "○"} {c.label}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <label className="label">Confirm Password *</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                className="input-field"
                value={form.confirm}
                onChange={(e) => update("confirm", e.target.value)}
              />
              {form.confirm.length > 0 && !passwordsMatch && (
                <p className="text-xs text-red-600 mt-1">Passwords don&apos;t match.</p>
              )}
            </div>

            <TurnstileWidget onToken={onTurnstileToken} />

            <p className="text-xs text-gray-500 font-sans bg-brand-orange-50 border border-brand-orange-100 px-3 py-2 rounded">
              For your security, we&apos;ll email you a 6-digit verification code every time you sign in.
            </p>

            {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3">{error}</p>}

            <button
              type="submit"
              disabled={loading || !passwordCheck.valid || !passwordsMatch}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-brand-orange-700 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
