"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Type,
  AlignLeft,
  Image as ImageIcon,
  MousePointerClick,
  Minus,
  PenTool,
  Eye,
  Save,
} from "lucide-react";

export type EmailBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "image"; url: string; alt?: string }
  | { kind: "button"; text: string; url: string }
  | { kind: "divider" }
  | { kind: "signature"; signoff: string; name: string };

interface Props {
  templateId?: string;
  initial?: {
    name: string;
    subject: string;
    blocks: EmailBlock[];
  };
}

const BLOCK_DEFAULTS: Record<EmailBlock["kind"], EmailBlock> = {
  heading: { kind: "heading", text: "A heading" },
  paragraph: { kind: "paragraph", text: "Your paragraph text…" },
  image: { kind: "image", url: "", alt: "" },
  button: { kind: "button", text: "Click here", url: "https://" },
  divider: { kind: "divider" },
  signature: { kind: "signature", signoff: "With love", name: "Wild Flower Vault" },
};

const BLOCK_META: Record<EmailBlock["kind"], { label: string; Icon: typeof Type }> = {
  heading: { label: "Heading", Icon: Type },
  paragraph: { label: "Paragraph", Icon: AlignLeft },
  image: { label: "Image", Icon: ImageIcon },
  button: { label: "Button", Icon: MousePointerClick },
  divider: { label: "Divider", Icon: Minus },
  signature: { label: "Signature", Icon: PenTool },
};

export function TemplateEditor({ templateId, initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [blocks, setBlocks] = useState<EmailBlock[]>(initial?.blocks ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewing, setPreviewing] = useState(false);

  function addBlock(kind: EmailBlock["kind"]) {
    setBlocks((prev) => [...prev, { ...BLOCK_DEFAULTS[kind] } as EmailBlock]);
  }
  function updateBlock(idx: number, patch: Partial<EmailBlock>) {
    setBlocks((prev) =>
      prev.map((b, i) => (i === idx ? ({ ...b, ...patch } as EmailBlock) : b)),
    );
  }
  function removeBlock(idx: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== idx));
  }
  function moveBlock(idx: number, dir: -1 | 1) {
    setBlocks((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  const save = useCallback(async () => {
    setError("");
    if (!name.trim()) return setError("Name is required.");
    if (!subject.trim()) return setError("Subject is required.");
    if (blocks.length === 0) return setError("Add at least one block.");
    setSaving(true);
    const isNew = !templateId;
    const url = isNew ? "/api/admin/email/templates" : `/api/admin/email/templates/${templateId}`;
    const method = isNew ? "POST" : "PATCH";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, subject, blocks }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not save.");
      return;
    }
    const saved = (await res.json()) as { id: string };
    if (isNew) router.push(`/admin/email/${saved.id}`);
    else router.refresh();
  }, [name, subject, blocks, templateId, router]);

  const preview = useCallback(async () => {
    setPreviewing(true);
    setError("");
    const res = await fetch("/api/admin/email/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, blocks }),
    });
    setPreviewing(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Preview failed.");
      return;
    }
    const data = (await res.json()) as { html: string };
    setPreviewHtml(data.html);
  }, [subject, blocks]);

  async function deleteTemplate() {
    if (!templateId) return;
    if (!confirm("Delete this template? Sent emails will keep their history.")) return;
    const res = await fetch(`/api/admin/email/templates/${templateId}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/email");
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-5 sm:p-6 space-y-4">
        <div>
          <label className="label" htmlFor="tpl-name">Template Name (internal)</label>
          <input
            id="tpl-name"
            type="text"
            className="input-field"
            placeholder="e.g. Consultation follow-up"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="tpl-subject">Email Subject Line</label>
          <input
            id="tpl-subject"
            type="text"
            className="input-field"
            placeholder="e.g. Thanks for the chat, {{first_name}}!"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">
            Merge fields: <code>{"{{name}}"}</code>, <code>{"{{first_name}}"}</code>, <code>{"{{email}}"}</code>
          </p>
        </div>
      </div>

      <div className="bg-white p-5 sm:p-6 space-y-4">
        <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-gray-700">Content</h2>

        {blocks.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center border border-dashed border-gray-200 rounded">
            No blocks yet. Add one below.
          </p>
        ) : (
          <ul className="space-y-3">
            {blocks.map((b, i) => {
              const meta = BLOCK_META[b.kind];
              return (
                <li key={i} className="border border-gray-100 rounded">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-gray-500">
                      <meta.Icon size={14} className="text-brand-orange-700" /> {meta.label}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveBlock(i, -1)} disabled={i === 0} className="p-1.5 text-gray-400 hover:text-brand-orange-700 disabled:opacity-30" aria-label="Move up">
                        <ArrowUp size={14} />
                      </button>
                      <button onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1} className="p-1.5 text-gray-400 hover:text-brand-orange-700 disabled:opacity-30" aria-label="Move down">
                        <ArrowDown size={14} />
                      </button>
                      <button onClick={() => removeBlock(i)} className="p-1.5 text-gray-400 hover:text-red-500" aria-label="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    {b.kind === "heading" && (
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Heading text"
                        value={b.text}
                        onChange={(e) => updateBlock(i, { text: e.target.value })}
                      />
                    )}
                    {b.kind === "paragraph" && (
                      <textarea
                        rows={4}
                        className="input-field resize-y"
                        placeholder="Your paragraph text…"
                        value={b.text}
                        onChange={(e) => updateBlock(i, { text: e.target.value })}
                      />
                    )}
                    {b.kind === "image" && (
                      <div className="space-y-2">
                        <input
                          type="url"
                          className="input-field"
                          placeholder="Image URL (https://…)"
                          value={b.url}
                          onChange={(e) => updateBlock(i, { url: e.target.value })}
                        />
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Alt text (for accessibility)"
                          value={b.alt ?? ""}
                          onChange={(e) => updateBlock(i, { alt: e.target.value })}
                        />
                      </div>
                    )}
                    {b.kind === "button" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Button text"
                          value={b.text}
                          onChange={(e) => updateBlock(i, { text: e.target.value })}
                        />
                        <input
                          type="url"
                          className="input-field"
                          placeholder="Link URL (https://…)"
                          value={b.url}
                          onChange={(e) => updateBlock(i, { url: e.target.value })}
                        />
                      </div>
                    )}
                    {b.kind === "divider" && (
                      <p className="text-xs text-gray-400">A horizontal line. No options.</p>
                    )}
                    {b.kind === "signature" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Sign-off (e.g. With love)"
                          value={b.signoff}
                          onChange={(e) => updateBlock(i, { signoff: e.target.value })}
                        />
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Your name"
                          value={b.name}
                          onChange={(e) => updateBlock(i, { name: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div>
          <p className="label">Add a block</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(BLOCK_META) as EmailBlock["kind"][]).map((kind) => {
              const meta = BLOCK_META[kind];
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => addBlock(kind)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-sans uppercase tracking-wider bg-gray-50 text-gray-600 hover:bg-brand-orange-50 hover:text-brand-orange-700 rounded"
                >
                  <Plus size={12} /> <meta.Icon size={12} /> {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3">{error}</p>
      )}

      <div className="flex flex-wrap gap-3">
        <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving…" : "Save Template"}
        </button>
        <button onClick={preview} disabled={previewing} className="btn-secondary flex items-center gap-2">
          {previewing ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
          Preview
        </button>
        {templateId && (
          <button onClick={deleteTemplate} className="ml-auto px-4 py-2 text-xs font-sans uppercase tracking-wider text-red-600 hover:bg-red-50 rounded flex items-center gap-2">
            <Trash2 size={14} /> Delete
          </button>
        )}
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
