import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(session: Session | null) {
  return (session?.user as { role?: string } | undefined)?.role === "ADMIN";
}

const CreateSchema = z.object({
  reason: z.string().max(200).optional().nullable(),
  allDay: z.boolean().default(false),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  recurrence: z.enum(["NONE", "WEEKLY"]).default("NONE"),
  // 0=Sun..6=Sat
  recurDays: z.array(z.number().int().min(0).max(6)).default([]),
  recurUntil: z.string().nullable().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await prisma.timeOff.findMany({
    orderBy: { startAt: "desc" },
    take: 200,
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let parsed;
  try {
    parsed = CreateSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid input", details: err instanceof z.ZodError ? err.errors : undefined }, { status: 400 });
  }

  const startAt = new Date(parsed.startAt);
  const endAt = new Date(parsed.endAt);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
    return NextResponse.json({ error: "End must be after start." }, { status: 400 });
  }
  if (parsed.recurrence === "WEEKLY" && parsed.recurDays.length === 0) {
    return NextResponse.json({ error: "Pick at least one weekday for weekly recurrence." }, { status: 400 });
  }
  const recurUntil = parsed.recurUntil ? new Date(parsed.recurUntil) : null;
  if (recurUntil && Number.isNaN(recurUntil.getTime())) {
    return NextResponse.json({ error: "Invalid recurUntil date." }, { status: 400 });
  }

  const created = await prisma.timeOff.create({
    data: {
      reason: parsed.reason || null,
      allDay: parsed.allDay,
      startAt,
      endAt,
      recurrence: parsed.recurrence,
      recurDays: parsed.recurrence === "WEEKLY" ? parsed.recurDays : [],
      recurUntil,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
