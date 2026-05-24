import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/email-token";

// Public endpoint — no auth. Idempotent.
export async function POST(req: NextRequest) {
  let token: string | null = null;
  try {
    const body = (await req.json()) as { token?: string };
    token = body.token ?? null;
  } catch {
    // ignore
  }
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  const email = verifyUnsubscribeToken(token);
  if (!email) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  await prisma.emailUnsubscribe.upsert({
    where: { email },
    update: {},
    create: { email, source: "link" },
  });

  return NextResponse.json({ ok: true, email });
}
