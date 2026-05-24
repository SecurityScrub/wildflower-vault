// HMAC-signed, opaque tokens used in unsubscribe links. The token encodes
// the email address so the public /unsubscribe endpoint can verify ownership
// without exposing a guessable identifier.

import { createHmac } from "crypto";

function getSecret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is not set; email tokens cannot be signed");
  return s;
}

function b64url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf, "utf8") : buf;
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64").toString("utf8");
}

/** Returns `<b64url(email)>.<b64url(hmac)>`. Stateless — no DB lookup needed
 * on the unsubscribe endpoint. */
export function signUnsubscribeToken(email: string): string {
  const norm = email.trim().toLowerCase();
  const payload = b64url(norm);
  const sig = createHmac("sha256", getSecret()).update(payload).digest();
  return `${payload}.${b64url(sig)}`;
}

/** Verifies and returns the email, or null if invalid. */
export function verifyUnsubscribeToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = b64url(createHmac("sha256", getSecret()).update(payload).digest());
  if (sig !== expected) return null;
  try {
    return b64urlDecode(payload);
  } catch {
    return null;
  }
}

export function unsubscribeUrl(email: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const token = signUnsubscribeToken(email);
  return `${base.replace(/\/$/, "")}/unsubscribe?token=${encodeURIComponent(token)}`;
}
