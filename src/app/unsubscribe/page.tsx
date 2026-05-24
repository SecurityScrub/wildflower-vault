"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

function UnsubscribeContent() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("This unsubscribe link is missing its token. If you copied it from an email, please use the original link.");
    }
  }, [token]);

  async function unsubscribe() {
    if (!token) return;
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json()) as { ok?: boolean; email?: string; error?: string };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error ?? "We couldn't process this unsubscribe request.");
        return;
      }
      setEmail(data.email ?? "");
      setStatus("done");
    } catch {
      setStatus("error");
      setError("Network error — please try again in a moment.");
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md bg-white shadow-sm p-7 sm:p-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="font-serif text-xl tracking-[0.2em] text-brand-orange-700">THE WILD FLOWER</div>
            <div className="font-sans text-[10px] tracking-[0.5em] uppercase text-brand-pink-500 mt-1">Vault</div>
          </Link>
        </div>

        {status === "done" ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-green-100 mx-auto flex items-center justify-center">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <h1 className="font-serif text-2xl text-brand-orange-700">You&apos;re unsubscribed</h1>
            <p className="font-sans text-sm text-gray-600 leading-relaxed">
              {email && (
                <>We won&apos;t send marketing emails to <strong className="text-brand-charcoal">{email}</strong> anymore.</>
              )}
            </p>
            <p className="font-sans text-xs text-gray-400 leading-relaxed">
              You&apos;ll still receive transactional emails like booking confirmations or consultation invites.
            </p>
            <div className="pt-4">
              <Link href="/" className="font-sans text-xs tracking-[0.2em] uppercase text-brand-pink-500 hover:text-brand-pink-600">
                Back to site →
              </Link>
            </div>
          </div>
        ) : status === "error" ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-50 mx-auto flex items-center justify-center">
              <AlertCircle size={28} className="text-red-600" />
            </div>
            <h1 className="font-serif text-2xl text-brand-orange-700">Something went wrong</h1>
            <p className="font-sans text-sm text-gray-600 leading-relaxed">{error}</p>
            <p className="font-sans text-xs text-gray-400">
              Need help? Reply directly to any email from us.
            </p>
            <div className="pt-4">
              <Link href="/" className="font-sans text-xs tracking-[0.2em] uppercase text-brand-pink-500 hover:text-brand-pink-600">
                Back to site →
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-5">
            <h1 className="font-serif text-2xl text-brand-orange-700">Unsubscribe from marketing emails</h1>
            <p className="font-sans text-sm text-gray-600 leading-relaxed">
              Click below to stop receiving marketing and promotional emails from The Wild Flower Vault.
            </p>
            <button
              type="button"
              onClick={unsubscribe}
              disabled={status === "loading"}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {status === "loading" && <Loader2 size={14} className="animate-spin" />}
              {status === "loading" ? "Unsubscribing…" : "Unsubscribe"}
            </button>
            <p className="font-sans text-xs text-gray-400 leading-relaxed">
              You&apos;ll still receive transactional emails (booking confirmations, consultation invites, account updates).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-cream" />}>
      <UnsubscribeContent />
    </Suspense>
  );
}
