import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTurnstile } from "@/lib/turnstile";
import { sendInquiryAck } from "@/lib/email";
import { z } from "zod";

const InquirySchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  eventDate: z.string().optional(),
  eventType: z.string().optional(),
  items: z.array(z.string()).optional(),
  message: z.string().min(10).max(2000),
  turnstileToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const data = InquirySchema.parse(body);

    // Verify Turnstile
    if (data.turnstileToken) {
      const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? undefined;
      const valid = await verifyTurnstile(data.turnstileToken, ip ?? undefined);
      if (!valid) {
        return NextResponse.json({ error: "Security check failed. Please try again." }, { status: 400 });
      }
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
        eventType: data.eventType,
        items: data.items ?? [],
        message: data.message,
      },
    });

    // Send acknowledgment email (non-blocking)
    sendInquiryAck({ to: data.email, name: data.name }).catch(console.error);

    return NextResponse.json({ id: inquiry.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 });
    }
    console.error("Inquiry error:", error);
    return NextResponse.json({ error: "Failed to send inquiry" }, { status: 500 });
  }
}
