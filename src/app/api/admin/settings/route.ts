import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/utils";

function isAdmin(session: Session | null) {
  return (session?.user as { role?: string } | undefined)?.role === "ADMIN";
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const group = searchParams.get("group");

  const settings = await prisma.setting.findMany({
    where: group ? { group } : undefined,
    orderBy: [{ group: "asc" }, { key: "asc" }],
  });

  // Mask secret values
  const masked = settings.map((s) => ({
    ...s,
    value: s.isSecret ? "••••••••" : s.value,
  }));

  return NextResponse.json(masked);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = (session!.user as { id: string }).id;
  const body = await req.json() as Record<string, unknown>;
  const { settings } = body as { settings: Array<{ key: string; value: string; isSecret?: boolean; label?: string; group?: string }> };

  if (!Array.isArray(settings)) {
    return NextResponse.json({ error: "settings must be an array" }, { status: 400 });
  }

  await Promise.all(
    settings.map(async (s) => {
      const storedValue = s.isSecret && s.value !== "••••••••"
        ? encrypt(s.value)
        : s.value === "••••••••"
        ? undefined // don't overwrite masked value
        : s.value;

      if (storedValue === undefined) return;

      await prisma.setting.upsert({
        where: { key: s.key },
        update: { value: storedValue, updatedBy: userId },
        create: {
          key: s.key,
          value: storedValue,
          isSecret: s.isSecret ?? false,
          label: s.label,
          group: s.group ?? "general",
          updatedBy: userId,
        },
      });
    })
  );

  return NextResponse.json({ ok: true });
}
