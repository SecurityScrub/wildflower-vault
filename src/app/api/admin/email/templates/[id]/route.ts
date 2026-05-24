import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(s: Session | null) {
  return (s?.user as { role?: string } | undefined)?.role === "ADMIN";
}

const BlockSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("heading"), text: z.string().max(500) }),
  z.object({ kind: z.literal("paragraph"), text: z.string().max(5000) }),
  z.object({ kind: z.literal("image"), url: z.string().url().max(2000), alt: z.string().max(200).optional() }),
  z.object({ kind: z.literal("button"), text: z.string().max(120), url: z.string().url().max(2000) }),
  z.object({ kind: z.literal("divider") }),
  z.object({ kind: z.literal("signature"), signoff: z.string().max(120), name: z.string().max(120) }),
]);

const PatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  subject: z.string().min(1).max(200).optional(),
  blocks: z.array(BlockSchema).max(50).optional(),
});

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const row = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  let parsed;
  try {
    parsed = PatchSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid input", details: err instanceof z.ZodError ? err.errors : undefined }, { status: 400 });
  }
  try {
    const updated = await prisma.emailTemplate.update({
      where: { id },
      data: parsed,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    await prisma.emailTemplate.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
