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

const CreateSchema = z.object({
  name: z.string().min(1).max(120),
  subject: z.string().min(1).max(200),
  blocks: z.array(BlockSchema).max(50),
  slug: z.string().max(120).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await prisma.emailTemplate.findMany({
    orderBy: [{ isPreset: "desc" }, { updatedAt: "desc" }],
  });
  return NextResponse.json(rows);
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
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

  let slug = parsed.slug ? slugify(parsed.slug) : slugify(parsed.name) || `template-${Date.now()}`;
  // Ensure uniqueness with a numeric suffix if needed.
  let attempt = 0;
  while (await prisma.emailTemplate.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${slugify(parsed.name) || "template"}-${attempt + 1}`;
    if (attempt > 50) {
      slug = `template-${Date.now()}`;
      break;
    }
  }

  const created = await prisma.emailTemplate.create({
    data: {
      slug,
      name: parsed.name,
      subject: parsed.subject,
      blocks: parsed.blocks,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
