import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

// Account lockout policy: 5 failures in a row = locked for 15 minutes.
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 15;

// MFA code policy: 6-digit numeric, valid for 10 minutes, 5 verification attempts.
const MFA_CODE_LIFETIME_MIN = 10;
const MFA_MAX_ATTEMPTS = 5;

export function generateMfaCode(): string {
  // Cryptographically-random 6-digit code (000000–999999).
  // Using Number.MAX_SAFE_INTEGER-safe modulo to avoid bias issues.
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const n = (bytes[0] << 24) + (bytes[1] << 16) + (bytes[2] << 8) + bytes[3];
  // n is unsigned 32-bit. 4_000_000_000 / 1_000_000 = 4000 → minimal bias.
  return String(Math.abs(n) % 1_000_000).padStart(6, "0");
}

export async function issueMfaCode(userId: string): Promise<string> {
  const code = generateMfaCode();
  const hash = await bcrypt.hash(code, 10);
  const expires = new Date(Date.now() + MFA_CODE_LIFETIME_MIN * 60 * 1000);
  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaCodeHash: hash,
      mfaCodeExpiresAt: expires,
      mfaCodeAttempts: 0,
    },
  });
  return code;
}

export interface MfaVerifyResult {
  ok: boolean;
  reason?: "no_code" | "expired" | "too_many_attempts" | "mismatch";
}

export async function verifyMfaCode(userId: string, code: string): Promise<MfaVerifyResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaCodeHash: true, mfaCodeExpiresAt: true, mfaCodeAttempts: true },
  });
  if (!user?.mfaCodeHash || !user.mfaCodeExpiresAt) {
    return { ok: false, reason: "no_code" };
  }
  if (user.mfaCodeExpiresAt < new Date()) {
    return { ok: false, reason: "expired" };
  }
  if (user.mfaCodeAttempts >= MFA_MAX_ATTEMPTS) {
    return { ok: false, reason: "too_many_attempts" };
  }

  const match = await bcrypt.compare(code, user.mfaCodeHash);
  if (!match) {
    await prisma.user.update({
      where: { id: userId },
      data: { mfaCodeAttempts: { increment: 1 } },
    });
    return { ok: false, reason: "mismatch" };
  }

  // Success: clear the code so it can't be reused.
  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaCodeHash: null,
      mfaCodeExpiresAt: null,
      mfaCodeAttempts: 0,
    },
  });
  return { ok: true };
}

export function userNeedsMfa(role: string | null | undefined): boolean {
  // Policy: every account *except* the single admin account requires MFA.
  return role !== "ADMIN";
}

// ─── Rate limiting / account lockout ────────────────────────────────────────

export async function isAccountLocked(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lockedUntil: true },
  });
  if (!user?.lockedUntil) return false;
  return user.lockedUntil > new Date();
}

export async function recordFailedLogin(userId: string): Promise<{ locked: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { failedLoginCount: true },
  });
  const newCount = (user?.failedLoginCount ?? 0) + 1;
  const data: { failedLoginCount: number; lockedUntil?: Date } = { failedLoginCount: newCount };
  let locked = false;
  if (newCount >= MAX_FAILED_LOGINS) {
    data.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
    locked = true;
  }
  await prisma.user.update({ where: { id: userId }, data });
  return { locked };
}

export async function recordSuccessfulLogin(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });
}

// ─── In-memory IP-based rate limit (best-effort; resets on deploy) ──────────
//
// This is a simple counter to slow brute-force from a single IP. For
// production-grade rate limiting, use a Redis/Upstash limiter — but this
// gives baseline protection while the app is running on a single Railway
// instance.

const ipCounts = new Map<string, { count: number; resetAt: number }>();
const IP_WINDOW_MS = 60_000;
const IP_MAX = 20;

export function checkIpRate(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const existing = ipCounts.get(ip);
  if (!existing || existing.resetAt < now) {
    ipCounts.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS });
    return { allowed: true };
  }
  existing.count += 1;
  if (existing.count > IP_MAX) {
    return { allowed: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
  }
  return { allowed: true };
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    (headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ??
    "unknown"
  );
}
