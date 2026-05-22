import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyTurnstile } from "@/lib/turnstile";
import { createCalendarEvent } from "@/lib/google-calendar";
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

    const consultation = await prisma.consultation.create({
      data: {
        leadId: data.leadId ?? null,
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

    if (data.leadId) {
      await prisma.weddingPlanningLead.update({
        where: { id: data.leadId },
        data: { status: "CONSULTATION_BOOKED", isRead: true, contactedAt: new Date() },
      });
    }

    // Side-effects: Google Calendar event, ICS email confirmation. Best-effort.
    const couple = data.partnerName ? `${data.name} & ${data.partnerName}` : data.name;
    const calendarEnabled = process.env.NODE_ENV !== "test";
    const calendarPromise = calendarEnabled
      ? createCalendarEvent({
          title: `Consultation — ${couple}`,
          description: `Wedding planning consultation\n\nClient: ${couple}\nEmail: ${data.email}${data.phone ? `\nPhone: ${data.phone}` : ""}${data.notes ? `\n\nNotes:\n${data.notes}` : ""}`,
          startDate: scheduledAt,
          endDate: endsAt,
          location: consultation.location ?? undefined,
        }).catch((err) => {
          console.error("[consultation] google calendar create failed", err);
          return null;
        })
      : Promise.resolve(null);

    const googleEventId = await calendarPromise;
    if (googleEventId) {
      await prisma.consultation.update({
        where: { id: consultation.id },
        data: { googleEventId },
      });
    }

    const config = getZeptoMailConfig();
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
        leadId: data.leadId,
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
