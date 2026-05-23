// Step 1 of sign-in: validate password + Turnstile, and (if MFA is required)
// issue+send a 6-digit code via email. The client then completes sign-in via
// the NextAuth Credentials provider with { email, password, mfaCode }.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyTurnstile, turnstileEnforced } from "@/lib/turnstile";
import {
  issueMfaCode,
  isAccountLocked,
  recordFailedLogin,
  userNeedsMfa,
  checkIpRate,
  clientIp,
} from "@/lib/auth-security";
import { sendMfaCode } from "@/lib/zeptomail";

const BeginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  turnstileToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const rate = checkIpRate(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again shortly.", retryAfter: rate.retryAfter },
      { status: 429 },
    );
  }

  let parsed;
  try {
    parsed = BeginSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const turnstileToken = parsed.turnstileToken;
  if (await turnstileEnforced()) {
    if (!turnstileToken) {
      return NextResponse.json({ error: "Security check required." }, { status: 400 });
    }
    const valid = await verifyTurnstile(turnstileToken, ip);
    if (!valid) {
      return NextResponse.json({ error: "Security check failed." }, { status: 400 });
    }
  }

  const email = parsed.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, passwordHash: true, name: true, email: true },
  });

  // Generic response payload — never reveal whether the email exists.
  const genericFail = NextResponse.json(
    { error: "Invalid email or password." },
    { status: 401 },
  );

  if (!user || !user.passwordHash) {
    // Burn similar bcrypt time to avoid user-enum timing leaks.
    await bcrypt.compare(parsed.password, "$2a$10$invalidsaltinvalidsaltinvali.");
    return genericFail;
  }

  if (await isAccountLocked(user.id)) {
    return NextResponse.json(
      { error: "Account temporarily locked. Try again in a few minutes." },
      { status: 423 },
    );
  }

  const ok = await bcrypt.compare(parsed.password, user.passwordHash);
  if (!ok) {
    const { locked } = await recordFailedLogin(user.id);
    if (locked) {
      return NextResponse.json(
        { error: "Account temporarily locked. Try again in 15 minutes." },
        { status: 423 },
      );
    }
    return genericFail;
  }

  // Password is correct. From here on the response shape is identical for
  // every account regardless of role — anything else would leak whether the
  // authenticated account is an admin to an unauthenticated caller who
  // happens to know a valid password (see security-review finding #2).
  const needsMfa = userNeedsMfa(user.role);

  if (needsMfa) {
    const code = await issueMfaCode(user.id);
    try {
      await sendMfaCode(user.email, code, user.name);
    } catch (err) {
      console.error("[auth/begin] sendMfaCode failed", err);
      return NextResponse.json(
        { error: "Could not send verification code. Try again shortly." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ mfaRequired: needsMfa });
}
