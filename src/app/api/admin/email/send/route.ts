import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMarketingEmail } from "@/lib/email-marketing";
import type { EmailBlock } from "@/lib/email-render";

function isAdmin(s: Session | null) {
  return (s?.user as { role?: string } | undefined)?.role === "ADMIN";
}

const SendSchema = z.object({
  templateId: z.string().min(1),
  recipients: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().max(120).nullable().optional(),
      }),
    )
    .min(1)
    .max(500),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let parsed;
  try {
    parsed = SendSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid input", details: err instanceof z.ZodError ? err.errors : undefined }, { status: 400 });
  }

  const template = await prisma.emailTemplate.findUnique({ where: { id: parsed.templateId } });
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const result = await sendMarketingEmail({
    templateId: template.id,
    templateName: template.name,
    slug: template.slug,
    subject: template.subject,
    blocks: template.blocks as EmailBlock[],
    recipients: parsed.recipients,
  });

  return NextResponse.json(result);
}
