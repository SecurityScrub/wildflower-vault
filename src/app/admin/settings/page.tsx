"use client";

import { useState, useEffect } from "react";
import { Loader2, Eye, EyeOff, Save, CheckCircle } from "lucide-react";

interface SettingField {
  key: string;
  label: string;
  placeholder?: string;
  isSecret?: boolean;
  type?: "text" | "select" | "toggle";
  options?: string[];
  hint?: string;
}

const SETTING_GROUPS: Array<{
  group: string;
  title: string;
  description: string;
  icon: string;
  fields: SettingField[];
}> = [
  {
    group: "square",
    title: "Square Payments",
    description: "Application ID + Access Token are required. Location ID is auto-discovered from your Square account — only set it if you need to override the default.",
    icon: "💳",
    fields: [
      { key: "square_environment", label: "Environment", type: "select", options: ["sandbox", "production"] },
      { key: "square_application_id", label: "Application ID", placeholder: "sq0idp-…", isSecret: true },
      { key: "square_access_token", label: "Access Token", placeholder: "EAAAl…", isSecret: true },
      { key: "square_location_id", label: "Location ID (optional override)", placeholder: "Leave blank to auto-discover", isSecret: true },
    ],
  },
  {
    group: "turnstile",
    title: "Cloudflare Turnstile",
    description: "Bot protection for your inquiry form.",
    icon: "🛡️",
    fields: [
      { key: "turnstile_site_key", label: "Site Key (public)", placeholder: "0x…" },
      { key: "turnstile_secret_key", label: "Secret Key", isSecret: true, placeholder: "0x…" },
    ],
  },
  {
    group: "business",
    title: "Business Info",
    description: "Basic business information used in emails and SEO.",
    icon: "🏢",
    fields: [
      { key: "business_name", label: "Business Name", placeholder: "The Wild Flower Vault" },
      { key: "business_email", label: "Admin Email (notifications sent here)", placeholder: "admin@…" },
      { key: "business_phone", label: "Phone Number" },
      { key: "business_address", label: "City/Address (for SEO)", placeholder: "Des Moines, Iowa" },
      { key: "instagram_url", label: "Instagram URL" },
      { key: "facebook_url", label: "Facebook URL" },
    ],
  },
];

type SettingsMap = Record<string, string>;
type ShowSecretsMap = Record<string, boolean>;

export default function AdminSettingsPage() {
  const [values, setValues] = useState<SettingsMap>({});
  const [original, setOriginal] = useState<SettingsMap>({});
  const [showSecret, setShowSecret] = useState<ShowSecretsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json() as Promise<Array<{ key: string; value: string }>>)
      .then((settings) => {
        const map: SettingsMap = {};
        settings.forEach((s) => { map[s.key] = s.value; });
        setValues(map);
        setOriginal(map);
        setLoading(false);
      });
  }, []);

  function update(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function saveGroup(group: string) {
    const groupConfig = SETTING_GROUPS.find((g) => g.group === group);
    if (!groupConfig) return;

    setSaving(group);
    const settings = groupConfig.fields.map((f) => ({
      key: f.key,
      value: values[f.key] ?? "",
      isSecret: f.isSecret ?? false,
      group,
      label: f.label,
    }));

    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });

    setSaving(null);
    setSaved(group);
    setTimeout(() => setSaved(null), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-brand-orange-700" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-3xl">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-brand-orange-700">Settings</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Configure integrations and business settings. Changes take effect immediately.
        </p>
      </div>

      <EmailDiagnostic />

      {SETTING_GROUPS.map((group) => (
        <div key={group.group} className="bg-white">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{group.icon}</span>
              <div className="min-w-0">
                <h2 className="font-serif text-lg sm:text-xl text-brand-orange-700">{group.title}</h2>
                <p className="font-sans text-xs text-gray-400 mt-0.5">{group.description}</p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            {group.fields.map((field) => (
              <div key={field.key}>
                <label className="label">{field.label}</label>
                {field.type === "select" ? (
                  <select
                    className="input-field"
                    value={values[field.key] ?? ""}
                    onChange={(e) => update(field.key, e.target.value)}
                  >
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.isSecret ? (
                  <div className="relative">
                    <input
                      type={showSecret[field.key] ? "text" : "password"}
                      className="input-field pr-10"
                      placeholder={values[field.key] === "••••••••" ? "Saved (click eye to reveal)" : (field.placeholder ?? "")}
                      value={values[field.key] ?? ""}
                      onChange={(e) => update(field.key, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret((p) => ({ ...p, [field.key]: !p[field.key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecret[field.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    className="input-field"
                    placeholder={field.placeholder ?? ""}
                    value={values[field.key] ?? ""}
                    onChange={(e) => update(field.key, e.target.value)}
                  />
                )}
                {field.hint && (
                  <p className="font-sans text-xs text-gray-400 mt-1">{field.hint}</p>
                )}
              </div>
            ))}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => saveGroup(group.group)}
                disabled={saving === group.group}
                className="btn-primary py-3 px-6 flex items-center justify-center gap-2 text-xs w-full sm:w-auto"
              >
                {saving === group.group ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : saved === group.group ? (
                  <CheckCircle size={14} />
                ) : (
                  <Save size={14} />
                )}
                {saved === group.group ? "Saved!" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmailDiagnostic() {
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; message?: string; error?: string; hint?: string; from?: string }>(null);

  async function run() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: to || undefined }),
      });
      const data = (await res.json()) as typeof result;
      setResult(data);
    } catch (err) {
      setResult({ ok: false, error: err instanceof Error ? err.message : "Network error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white">
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📨</span>
          <div className="min-w-0">
            <h2 className="font-serif text-lg sm:text-xl text-brand-orange-700">Email Diagnostic</h2>
            <p className="font-sans text-xs text-gray-400 mt-0.5">
              Send a test email through the ZeptoMail HTTP API and see the actual response. Default recipient is <code>ADMIN_EMAIL</code>.
            </p>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            className="input-field flex-1"
            placeholder="Override recipient (optional) — defaults to ADMIN_EMAIL"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <button
            onClick={run}
            disabled={busy}
            className="btn-primary py-3 px-5 text-xs flex items-center justify-center gap-2 shrink-0"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : null}
            {busy ? "Sending…" : "Send Test Email"}
          </button>
        </div>

        {result && (
          <div
            className={`border px-4 py-3 text-sm font-sans ${
              result.ok
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <p className="font-semibold">
              {result.ok ? "✓ " : "✗ "}
              {result.ok ? result.message : result.error}
            </p>
            {result.from && (
              <p className="text-xs mt-1 opacity-70">Sent from: {result.from}</p>
            )}
            {result.hint && (
              <p className="text-xs mt-2 opacity-80 leading-relaxed">{result.hint}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
