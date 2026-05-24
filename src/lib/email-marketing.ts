// Marketing-email send pipeline. Wraps the renderer + ZeptoMail HTTP
// transport + per-recipient unsubscribe filtering + per-recipient EmailSend
// row write so the admin gets a real audit log of every campaign.
//
// Unsubscribed addresses are skipped silently (status=SKIPPED_UNSUBSCRIBED).
// Failures are recorded but never throw — one bad address won't poison a
// batch.

import { prisma } from "./prisma";
import { sendZeptoMail } from "./zeptomail";
import { renderEmail, renderSubject, type EmailBlock } from "./email-render";
import { unsubscribeUrl } from "./email-token";

export interface MarketingRecipient {
  email: string;
  name?: string | null;
}

export interface SendMarketingParams {
  templateId: string | null;
  templateName: string;
  slug?: string | null;
  subject: string;
  blocks: EmailBlock[];
  recipients: MarketingRecipient[];
}

export interface SendResult {
  total: number;
  sent: number;
  skipped: number;
  failed: number;
  detail: Array<{ email: string; status: "SENT" | "SKIPPED_UNSUBSCRIBED" | "FAILED"; error?: string }>;
}

export async function sendMarketingEmail(params: SendMarketingParams): Promise<SendResult> {
  const seen = new Set<string>();
  const recipients = params.recipients.filter((r) => {
    const e = r.email.trim().toLowerCase();
    if (!e || seen.has(e)) return false;
    seen.add(e);
    return true;
  });

  if (recipients.length === 0) {
    return { total: 0, sent: 0, skipped: 0, failed: 0, detail: [] };
  }

  // One DB round-trip to find every unsubscribed address in the batch.
  const unsubscribed = await prisma.emailUnsubscribe.findMany({
    where: { email: { in: recipients.map((r) => r.email.trim().toLowerCase()) } },
    select: { email: true },
  });
  const blocked = new Set(unsubscribed.map((u) => u.email));

  const detail: SendResult["detail"] = [];
  for (const r of recipients) {
    const email = r.email.trim().toLowerCase();
    if (blocked.has(email)) {
      await prisma.emailSend.create({
        data: {
          templateId: params.templateId,
          templateName: params.templateName,
          recipientEmail: email,
          recipientName: r.name ?? null,
          subject: params.subject,
          status: "SKIPPED_UNSUBSCRIBED",
        },
      });
      detail.push({ email, status: "SKIPPED_UNSUBSCRIBED" });
      continue;
    }

    const subject = renderSubject(params.subject, { email, name: r.name });
    const html = renderEmail(params.blocks, {
      recipient: { email, name: r.name },
      unsubscribeUrl: unsubscribeUrl(email),
    });

    try {
      await sendZeptoMail({
        to: { address: email, name: r.name ?? undefined },
        subject,
        html,
      });
      await prisma.emailSend.create({
        data: {
          templateId: params.templateId,
          templateName: params.templateName,
          recipientEmail: email,
          recipientName: r.name ?? null,
          subject,
          status: "SENT",
        },
      });
      detail.push({ email, status: "SENT" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await prisma.emailSend.create({
        data: {
          templateId: params.templateId,
          templateName: params.templateName,
          recipientEmail: email,
          recipientName: r.name ?? null,
          subject,
          status: "FAILED",
          error: msg.slice(0, 500),
        },
      });
      detail.push({ email, status: "FAILED", error: msg });
    }
  }

  return {
    total: recipients.length,
    sent: detail.filter((d) => d.status === "SENT").length,
    skipped: detail.filter((d) => d.status === "SKIPPED_UNSUBSCRIBED").length,
    failed: detail.filter((d) => d.status === "FAILED").length,
    detail,
  };
}
