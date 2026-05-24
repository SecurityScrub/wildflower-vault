import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { renderEmail, renderSubject, type EmailBlock } from "@/lib/email-render";
import { unsubscribeUrl } from "@/lib/email-token";

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

const PreviewSchema = z.object({
  subject: z.string().min(1).max(200),
  blocks: z.array(BlockSchema).max(50),
  recipient: z.object({
    email: z.string().email().default("preview@example.com"),
    name: z.string().max(120).nullable().optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let parsed;
  try {
    parsed = PreviewSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid input", details: err instanceof z.ZodError ? err.errors : undefined }, { status: 400 });
  }

  const recipient = parsed.recipient ?? { email: "preview@example.com", name: "Sample Recipient" };
  const blocks = parsed.blocks as EmailBlock[];
  const html = renderEmail(blocks, {
    recipient: { email: recipient.email, name: recipient.name ?? null },
    unsubscribeUrl: unsubscribeUrl(recipient.email),
  });
  const subject = renderSubject(parsed.subject, { email: recipient.email, name: recipient.name ?? null });

  return NextResponse.json({ html, subject });
}
