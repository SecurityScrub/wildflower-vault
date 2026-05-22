import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyTurnstile } from "@/lib/turnstile";
import {
  sendWeddingPlanningLeadAck,
  sendWeddingPlanningLeadNotification,
} from "@/lib/zeptomail";

const LeadSchema = z.object({
  name: z.string().min(1).max(100),
  partnerName: z.string().max(100).optional().nullable(),
  email: z.string().email(),
  phone: z.string().max(40).optional().nullable(),
  weddingDate: z.string().optional().nullable(),
  flexibleDate: z.boolean().optional(),
  guestCount: z.number().int().positive().max(5000).optional().nullable(),
  venue: z.string().max(200).optional().nullable(),
  budget: z.string().max(80).optional().nullable(),
  planningType: z.string().max(80).optional().nullable(),
  servicesNeeded: z.array(z.string().max(80)).max(20).optional(),
  hearAboutUs: z.string().max(120).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
  turnstileToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const data = LeadSchema.parse(body);

    if (data.turnstileToken) {
      const ip =
        req.headers.get("cf-connecting-ip") ??
        req.headers.get("x-forwarded-for") ??
        undefined;
      const valid = await verifyTurnstile(data.turnstileToken, ip ?? undefined);
      if (!valid) {
        return NextResponse.json(
          { error: "Security check failed. Please try again." },
          { status: 400 },
        );
      }
    }

    const lead = await prisma.weddingPlanningLead.create({
      data: {
        name: data.name,
        partnerName: data.partnerName ?? null,
        email: data.email,
        phone: data.phone ?? null,
        weddingDate: data.weddingDate ? new Date(data.weddingDate) : null,
        flexibleDate: data.flexibleDate ?? false,
        guestCount: data.guestCount ?? null,
        venue: data.venue ?? null,
        budget: data.budget ?? null,
        planningType: data.planningType ?? null,
        servicesNeeded: data.servicesNeeded ?? [],
        hearAboutUs: data.hearAboutUs ?? null,
        message: data.message ?? null,
      },
    });

    const emailParams = {
      name: lead.name,
      partnerName: lead.partnerName,
      email: lead.email,
      phone: lead.phone,
      weddingDate: lead.weddingDate,
      flexibleDate: lead.flexibleDate,
      guestCount: lead.guestCount,
      venue: lead.venue,
      budget: lead.budget,
      planningType: lead.planningType,
      servicesNeeded: lead.servicesNeeded,
      hearAboutUs: lead.hearAboutUs,
      message: lead.message,
    };

    Promise.all([
      sendWeddingPlanningLeadAck(emailParams),
      sendWeddingPlanningLeadNotification(emailParams),
    ]).catch((err) => {
      console.error("[wedding-planning] email send failed", err);
    });

    return NextResponse.json({ id: lead.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Wedding planning lead error:", error);
    return NextResponse.json(
      { error: "Failed to submit inquiry" },
      { status: 500 },
    );
  }
}
