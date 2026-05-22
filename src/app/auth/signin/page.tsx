"use client";

import { Suspense, useCallback, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { TurnstileWidget } from "@/components/TurnstileWidget";

type Step = "credentials" | "mfa";

const NEXTAUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Invalid email or password.",
  missing_credentials: "Please enter your email and password.",
  account_locked: "Your account is temporarily locked. Try again in a few minutes.",
  mfa_required: "Enter the verification code we just emailed you.",
  mfa_invalid: "That verification code didn't match. Try again.",
  mfa_expired: "That code expired. Sign in again to get a new one.",
  mfa_no_code: "No active verification code. Sign in again.",
  mfa_too_many_attempts: "Too many code attempts. Sign in again.",
};

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/portal";

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  const onTurnstileToken = useCallback((t: string) => setTurnstileToken(t), []);

  async function handleCredentialsStep(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/begin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, turnstileToken }),
      });
      const data = (await res.json()) as { mfaRequired?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Sign-in failed");

      if (data.mfaRequired) {
        setStep("mfa");
        setLoading(false);
        return;
      }

      // No MFA required (admin account). Complete sign-in directly.
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError(NEXTAUTH_ERROR_MESSAGES[result.error] ?? "Sign-in failed.");
        setLoading(false);
        return;
      }
      router.push(callbackUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setLoading(false);
    }
  }

  async function handleMfaStep(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      mfaCode: mfaCode.trim(),
      redirect: false,
    });

    if (result?.error) {
      setError(NEXTAUTH_ERROR_MESSAGES[result.error] ?? "Verification failed.");
      if (result.error === "mfa_expired" || result.error === "mfa_too_many_attempts") {
        setStep("credentials");
        setMfaCode("");
      }
      setLoading(false);
      return;
    }

    router.push(callbackUrl);
  }

  return (
    <div className="bg-white p-8 shadow-sm">
      {step === "credentials" ? (
        <form onSubmit={handleCredentialsStep} className="space-y-5">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <TurnstileWidget onToken={onTurnstileToken} />

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleMfaStep} className="space-y-5">
          <div>
            <p className="font-sans text-sm text-gray-600 mb-3">
              We sent a 6-digit verification code to <strong>{email}</strong>.
              The code expires in 10 minutes.
            </p>
            <label className="label" htmlFor="mfa">Verification code</label>
            <input
              id="mfa"
              type="text"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              className="input-field tracking-[0.5em] text-center text-2xl font-mono"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || mfaCode.length !== 6}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? "Verifying…" : "Verify & sign in"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("credentials");
              setMfaCode("");
              setError("");
            }}
            className="block mx-auto text-xs text-gray-400 hover:text-brand-orange-700 font-sans"
          >
            ← Use a different account
          </button>
        </form>
      )}

      <p className="text-center text-sm text-gray-400 mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/auth/register" className="text-brand-orange-700 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <div className="font-serif text-2xl tracking-[0.2em] text-brand-orange-700">
              THE WILD FLOWER
            </div>
            <div className="font-sans text-xs tracking-[0.5em] uppercase text-brand-pink-500 mt-1">
              VAULT
            </div>
          </Link>
          <h1 className="font-serif text-3xl text-brand-orange-700 mt-6">Sign In</h1>
          <p className="text-sm text-gray-400 mt-2">Access your customer portal</p>
        </div>

        <Suspense fallback={<div className="bg-white p-8 shadow-sm animate-pulse h-64" />}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
