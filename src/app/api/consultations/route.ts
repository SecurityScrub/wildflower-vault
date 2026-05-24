import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyTurnstile } from "@/lib/turnstile";
import { buildICS, icsToBase64 } from "@/lib/ics";
import {
  sendConsultationConfirmation,
  sendConsultationAdminNotice,
  getZeptoMailConfig,
} from "@/lib/zeptomail";

const ConsultationSchema = z.object({
  name: z.string().min(1).max(100),
  partnerName: z.string().max(100).optional().nullable(),
  email: z.string().email(),
  phone: z.string().max(40).optional().nullable(),
  scheduledAt: z.string(),
  durationMin: z.number().int().min(15).max(180).optional(),
  location: z.string().max(120).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  leadId: z.string().max(50).optional().nullable(),
  turnstileToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    const data = ConsultationSchema.parse(body);

    if (data.turnstileToken) {
      const ip =
        req.headers.get("cf-connecting-ip") ??
        req.headers.get("x-forwarded-for") ??
        undefined;
      const valid = await verifyTurnstile(data.turnstileToken, ip ?? undefined);
      if (!valid) {
        return NextResponse.json({ error: "Security check failed." }, { status: 400 });
      }
    }

    const scheduledAt = new Date(data.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    if (scheduledAt.getTime() < Date.now() + 60 * 60 * 1000) {
      return NextResponse.json(
        { error: "Please choose a time at least an hour from now." },
        { status: 400 },
      );
    }

    const durationMin = data.durationMin ?? 30;
    const endsAt = new Date(scheduledAt.getTime() + durationMin * 60 * 1000);

    // Lead linkage: an unauthenticated caller can supply `leadId`, but we only
    // honor it if the email on the request matches the lead's stored email.
    // Without this check, anyone who guessed or saw a lead cuid could promote
    // that lead's pipeline status and steer its confirmation email to an
    // arbitrary address (security-review finding #1).
    const submittedEmail = data.email.toLowerCase().trim();
    let verifiedLeadId: string | null = null;
    if (data.leadId) {
      const lead = await prisma.weddingPlanningLead.findUnique({
        where: { id: data.leadId },
        select: { id: true, email: true },
      });
      if (lead && lead.email.toLowerCase().trim() === submittedEmail) {
        verifiedLeadId = lead.id;
      }
      // If the email doesn't match, we silently drop the linkage rather than
      // erroring — the consultation still gets recorded so the planner can
      // see and manually associate it if appropriate.
    }

    const consultation = await prisma.consultation.create({
      data: {
        leadId: verifiedLeadId,
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        scheduledAt,
        durationMin,
        location: data.location ?? "Phone (we'll call you)",
        notes: data.notes ?? null,
        status: "CONFIRMED",
      },
    });

    if (verifiedLeadId) {
      await prisma.weddingPlanningLead.update({
        where: { id: verifiedLeadId },
        data: { status: "CONSULTATION_BOOKED", isRead: true, contactedAt: new Date() },
      });
    }

    // Build .ics calendar invite. The same invite is attached to the customer
    // confirmation AND the planner notification so both can drop the
    // consultation into their own calendar.
    const config = getZeptoMailConfig();
    const couple = data.partnerName ? `${data.name} & ${data.partnerName}` : data.name;
    const ics = buildICS({
      uid: `consultation-${consultation.id}@thewildflowervault.com`,
      summary: `Wedding planning consultation — The Wild Flower Vault`,
      description:
        consultation.notes ??
        "Your complimentary wedding planning consultation with The Wild Flower Vault.",
      location: consultation.location ?? "Phone",
      start: scheduledAt,
      end: endsAt,
      organizerName: config.fromName,
      organizerEmail: config.fromEmail || undefined,
      attendeeName: couple,
      attendeeEmail: data.email,
    });
    const icsBase64 = icsToBase64(ics);

    void Promise.all([
      sendConsultationConfirmation({
        name: data.name,
        partnerName: data.partnerName,
        email: data.email,
        scheduledAt,
        durationMin,
        location: consultation.location,
        notes: data.notes,
        icsBase64,
      }),
      sendConsultationAdminNotice({
        name: data.name,
        partnerName: data.partnerName,
        email: data.email,
        scheduledAt,
        durationMin,
        location: consultation.location,
        notes: data.notes,
        leadId: verifiedLeadId,
        icsBase64,
      }),
    ]).catch((err) => console.error("[consultation] email send failed", err));

    return NextResponse.json({ id: consultation.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Consultation booking error:", error);
    return NextResponse.json({ error: "Failed to book consultation" }, { status: 500 });
  }
}
