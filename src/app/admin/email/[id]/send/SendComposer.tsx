"use client";

import { useCallback, useMemo, useState } from "react";
import { Loader2, Eye, Send as SendIcon, CheckCircle, AlertTriangle } from "lucide-react";
import type { EmailBlock } from "../../TemplateEditor";

interface Lead {
  id: string;
  name: string;
  partnerName: string | null;
  email: string;
  status: string;
}

interface Props {
  templateId: string;
  subject: string;
  blocks: EmailBlock[];
  recentLeads: Lead[];
}

interface Recipient {
  email: string;
  name?: string | null;
}

// Parse a textarea full of recipients. Accepts "Name <email>", plain
// "email", and one-per-line or comma-separated.
function parseRecipients(text: string): Recipient[] {
  const out: Recipient[] = [];
  const seen = new Set<string>();
  for (const raw of text.split(/[\n,;]+/)) {
    const piece = raw.trim();
    if (!piece) continue;
    const match = piece.match(/^\s*(?:"?([^<"]+?)"?\s*)?<?([^\s<>]+@[^\s<>]+)>?\s*$/);
    if (!match) continue;
    const email = match[2].toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);
    out.push({ email, name: match[1]?.trim() || null });
  }
  return out;
}

export function SendComposer({ templateId, subject, blocks, recentLeads }: Props) {
  const [text, setText] = useState("");
  const [pickedLeads, setPickedLeads] = useState<Set<string>>(new Set());
  const [previewing, setPreviewing] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<null | { total: number; sent: number; skipped: number; failed: number }>(null);

  const recipients = useMemo<Recipient[]>(() => {
    const seen = new Set<string>();
    const out: Recipient[] = [];
    for (const r of parseRecipients(text)) {
      if (seen.has(r.email)) continue;
      seen.add(r.email);
      out.push(r);
    }
    for (const id of pickedLeads) {
      const lead = recentLeads.find((l) => l.id === id);
      if (!lead) continue;
      const email = lead.email.toLowerCase();
      if (seen.has(email)) continue;
      seen.add(email);
      const name = lead.partnerName ? `${lead.name} & ${lead.partnerName}` : lead.name;
      out.push({ email, name });
    }
    return out;
  }, [text, pickedLeads, recentLeads]);

  function toggleLead(id: string) {
    setPickedLeads((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const preview = useCallback(async () => {
    setPreviewing(true);
    setError("");
    const sample = recipients[0] ?? { email: "preview@example.com", name: "Sample" };
    const res = await fetch("/api/admin/email/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, blocks, recipient: sample }),
    });
    setPreviewing(false);
    if (!res.ok) {
      setError("Preview failed.");
      return;
    }
    const data = (await res.json()) as { html: string };
    setPreviewHtml(data.html);
  }, [subject, blocks, recipients]);

  async function send() {
    setError("");
    setResult(null);
    if (recipients.length === 0) {
      setError("Add at least one recipient.");
      return;
    }
    if (!confirm(`Send to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}? This will go out immediately.`)) {
      return;
    }
    setSending(true);
    const res = await fetch("/api/admin/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId, recipients }),
    });
    setSending(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Send failed.");
      return;
    }
    const data = (await res.json()) as { total: number; sent: number; skipped: number; failed: number };
    setResult(data);
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="bg-white p-5 sm:p-6 space-y-4">
        <div>
          <label className="label" htmlFor="recipients">Recipients</label>
          <textarea
            id="recipients"
            rows={5}
            className="input-field resize-y font-mono text-sm"
            placeholder={"One per line or comma-separated:\nname@example.com\n\"Jane Smith\" <jane@example.com>"}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">
            Accepts <code>email@example.com</code> or <code>Name &lt;email@example.com&gt;</code>. Duplicates are dropped.
          </p>
        </div>

        {recentLeads.length > 0 && (
          <div>
            <p className="label">Or pick from recent leads</p>
            <div className="max-h-48 overflow-y-auto border border-gray-100 rounded">
              {recentLeads.map((lead) => {
                const couple = lead.partnerName ? `${lead.name} & ${lead.partnerName}` : lead.name;
                const picked = pickedLeads.has(lead.id);
                return (
                  <label key={lead.id} className="flex items-center gap-3 p-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0">
                    <input
                      type="checkbox"
                      checked={picked}
                      onChange={() => toggleLead(lead.id)}
                      className="w-4 h-4 accent-brand-orange-700"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{couple}</p>
                      <p className="text-xs text-gray-500 truncate">{lead.email} · {lead.status}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded bg-brand-cream px-4 py-3 text-sm text-brand-orange-700 flex items-center gap-2">
          <strong>{recipients.length}</strong> recipient{recipients.length === 1 ? "" : "s"} ready to send
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3">{error}</p>
      )}

      {result && (
        <div className="bg-white border border-gray-100 p-5 space-y-2">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle size={16} />
            <p className="font-sans text-sm font-semibold">Send complete</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-green-50 p-3">
              <p className="font-serif text-xl text-green-700">{result.sent}</p>
              <p className="text-[10px] uppercase tracking-wider text-gray-500">Sent</p>
            </div>
            <div className="bg-gray-50 p-3">
              <p className="font-serif text-xl text-gray-700">{result.skipped}</p>
              <p className="text-[10px] uppercase tracking-wider text-gray-500">Unsubscribed (skipped)</p>
            </div>
            <div className={`p-3 ${result.failed > 0 ? "bg-red-50" : "bg-gray-50"}`}>
              <p className={`font-serif text-xl ${result.failed > 0 ? "text-red-700" : "text-gray-700"}`}>{result.failed}</p>
              <p className="text-[10px] uppercase tracking-wider text-gray-500">Failed</p>
            </div>
          </div>
          {result.failed > 0 && (
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <AlertTriangle size={12} className="text-amber-500" /> Failures recorded; check the admin send log for details.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={send}
          disabled={sending || recipients.length === 0}
          className="btn-primary flex items-center gap-2"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <SendIcon size={14} />}
          {sending ? "Sending…" : `Send to ${recipients.length}`}
        </button>
        <button onClick={preview} disabled={previewing} className="btn-secondary flex items-center gap-2">
          {previewing ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
          Preview
        </button>
      </div>

      {previewHtml && (
        <div className="bg-white border border-gray-100 overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-sans uppercase tracking-wider text-gray-500">Preview</span>
            <button onClick={() => setPreviewHtml("")} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
          </div>
          <iframe
            title="Email preview"
            srcDoc={previewHtml}
            className="w-full"
            style={{ height: 700, border: "none" }}
          />
        </div>
      )}
    </div>
  );
}
