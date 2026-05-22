import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { validatePassword, PASSWORD_POLICY } from "@/lib/password";
import { verifyTurnstile } from "@/lib/turnstile";
import { checkIpRate, clientIp } from "@/lib/auth-security";

const RegisterSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(PASSWORD_POLICY.minLength).max(PASSWORD_POLICY.maxLength),
  phone: z.string().max(40).optional(),
  turnstileToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const rate = checkIpRate(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again shortly." },
      { status: 429 },
    );
  }

  try {
    const body = (await req.json()) as unknown;
    const data = RegisterSchema.parse(body);

    if (process.env.TURNSTILE_SECRET_KEY) {
      if (!data.turnstileToken) {
        return NextResponse.json({ error: "Security check required." }, { status: 400 });
      }
      const ok = await verifyTurnstile(data.turnstileToken, ip);
      if (!ok) {
        return NextResponse.json({ error: "Security check failed." }, { status: 400 });
      }
    }

    const policy = validatePassword(data.password);
    if (!policy.valid) {
      return NextResponse.json(
        { error: policy.errors.join(" ") },
        { status: 400 },
      );
    }

    const emailNorm = data.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const hash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: emailNorm,
        passwordHash: hash,
        phone: data.phone,
        role: "CUSTOMER",
        // Email-based MFA is required for all non-admin accounts. We mark
        // mfaEnabled true on creation; the actual code is issued at sign-in.
        mfaEnabled: true,
      },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 });
    }
    console.error("Register error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
