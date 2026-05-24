// ZeptoMail HTTP API client.
// Docs: https://www.zoho.com/zeptomail/help/api/email-sending.html

interface ZeptoMailRecipient {
  email_address: { address: string; name?: string };
}

interface ZeptoMailAttachment {
  // base64-encoded content
  content: string;
  mime_type: string;
  name: string;
}

interface ZeptoMailPayload {
  from: { address: string; name?: string };
  to: ZeptoMailRecipient[];
  reply_to?: { address: string; name?: string }[];
  subject: string;
  htmlbody: string;
  textbody?: string;
  attachments?: ZeptoMailAttachment[];
}

export interface ZeptoMailMessage {
  to: { address: string; name?: string };
  subject: string;
  html: string;
  text?: string;
  replyTo?: { address: string; name?: string };
  attachments?: { content: string; mimeType: string; name: string }[];
}

export function getZeptoMailConfig() {
  return {
    apiUrl: process.env.ZEPTOMAIL_API_URL ?? "https://api.zeptomail.com/v1.1/email",
    token: process.env.ZEPTOMAIL_API_TOKEN ?? "",
    fromEmail: process.env.ZEPTOMAIL_FROM_EMAIL ?? "",
    fromName: process.env.ZEPTOMAIL_FROM_NAME ?? "The Wild Flower Vault",
    adminEmail: process.env.ADMIN_EMAIL ?? "",
  };
}

export async function sendZeptoMail(message: ZeptoMailMessage): Promise<void> {
  const config = getZeptoMailConfig();

  if (!config.token || !config.fromEmail) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[zeptomail] missing token or from email — skipping send", message.subject);
      return;
    }
    throw new Error("ZeptoMail is not configured");
  }

  const payload: ZeptoMailPayload = {
    from: { address: config.fromEmail, name: config.fromName },
    to: [{ email_address: message.to }],
    subject: message.subject,
    htmlbody: message.html,
  };
  if (message.text) payload.textbody = message.text;
  if (message.replyTo) payload.reply_to = [message.replyTo];
  if (message.attachments && message.attachments.length > 0) {
    payload.attachments = message.attachments.map((a) => ({
      content: a.content,
      mime_type: a.mimeType,
      name: a.name,
    }));
  }

  const res = await fetch(config.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Zoho-enczapikey ${config.token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ZeptoMail send failed (${res.status}): ${body}`);
  }
}

interface WeddingPlanningLeadEmailParams {
  name: string;
  partnerName?: string | null;
  email: string;
  phone?: string | null;
  weddingDate?: Date | null;
  flexibleDate: boolean;
  guestCount?: number | null;
  venue?: string | null;
  budget?: string | null;
  planningType?: string | null;
  servicesNeeded: string[];
  hearAboutUs?: string | null;
  message?: string | null;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatWeddingDate(date: Date | null | undefined, flexible: boolean): string {
  if (!date) return flexible ? "Flexible / TBD" : "Not specified";
  const formatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
  return flexible ? `${formatted} (flexible)` : formatted;
}

export async function sendWeddingPlanningLeadAck(params: WeddingPlanningLeadEmailParams): Promise<void> {
  const greetingName = params.partnerName
    ? `${params.name} & ${params.partnerName}`
    : params.name;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: #2d5016; padding: 32px; text-align: center;">
        <h1 style="color: #c9a84c; font-size: 26px; margin: 0; letter-spacing: 2px;">
          THE WILD FLOWER VAULT
        </h1>
        <p style="color: #fefcf7; margin: 8px 0 0; font-size: 13px; letter-spacing: 1px;">
          WEDDING PLANNING &amp; COORDINATION
        </p>
      </div>
      <div style="padding: 40px 32px; background: #fefcf7;">
        <p style="font-size: 18px; color: #2d5016; margin: 0 0 16px;">Dear ${escapeHtml(greetingName)},</p>
        <p style="line-height: 1.6;">
          Thank you for reaching out about wedding planning with The Wild Flower Vault!
          We&rsquo;re so excited to hear about your big day.
        </p>
        <p style="line-height: 1.6;">
          One of our planners will personally review your inquiry and get back to you within
          <strong>24&ndash;48 hours</strong> to schedule a complimentary consultation.
        </p>
        <div style="background: #f7f2e8; border-left: 4px solid #c9a84c; padding: 20px; margin: 28px 0;">
          <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 1px; color: #2d5016; text-transform: uppercase;">Wedding Date</p>
          <p style="margin: 0; font-size: 16px; color: #2d5016;">
            ${escapeHtml(formatWeddingDate(params.weddingDate ?? null, params.flexibleDate))}
          </p>
        </div>
        <p style="line-height: 1.6;">
          In the meantime, feel free to browse our
          <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/rentals" style="color: #2d5016;">rental collection</a>
          or learn more about our services on the site.
        </p>
        <p style="line-height: 1.6; margin-top: 32px;">
          With love,<br />
          <em style="color: #2d5016;">The Wild Flower Vault Team</em>
        </p>
      </div>
      <div style="background: #1a1a1a; padding: 20px; text-align: center;">
        <p style="color: #888; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} The Wild Flower Vault &middot; Des Moines, Iowa
        </p>
      </div>
    </div>
  `;

  await sendZeptoMail({
    to: { address: params.email, name: greetingName },
    subject: "We received your wedding planning inquiry",
    html,
  });
}

export async function sendWeddingPlanningLeadNotification(params: WeddingPlanningLeadEmailParams): Promise<void> {
  const config = getZeptoMailConfig();
  if (!config.adminEmail) return;

  const couple = params.partnerName
    ? `${params.name} & ${params.partnerName}`
    : params.name;

  const rows: Array<[string, string]> = [
    ["Couple", couple],
    ["Email", params.email],
    ["Phone", params.phone ?? "—"],
    ["Wedding Date", formatWeddingDate(params.weddingDate ?? null, params.flexibleDate)],
    ["Guest Count", params.guestCount != null ? String(params.guestCount) : "—"],
    ["Venue", params.venue ?? "—"],
    ["Budget", params.budget ?? "—"],
    ["Planning Type", params.planningType ?? "—"],
    ["Services", params.servicesNeeded.length ? params.servicesNeeded.join(", ") : "—"],
    ["Heard About Us", params.hearAboutUs ?? "—"],
  ];

  const rowsHtml = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding: 8px 16px 8px 0; color: #666; font-size: 13px; vertical-align: top; white-space: nowrap;">${escapeHtml(label)}</td>
          <td style="padding: 8px 0; font-size: 14px;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  const messageBlock = params.message
    ? `
        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
          <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 1px; color: #666; text-transform: uppercase;">Message</p>
          <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(params.message)}</p>
        </div>`
    : "";

  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 640px; margin: 0 auto;">
      <h2 style="color: #2d5016; margin: 0 0 8px;">New Wedding Planning Lead</h2>
      <p style="color: #666; margin: 0 0 24px;">${escapeHtml(couple)} just submitted a wedding planning inquiry.</p>
      <table style="width: 100%; border-collapse: collapse;">${rowsHtml}</table>
      ${messageBlock}
      <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/wedding-planning-leads"
         style="display: inline-block; margin-top: 28px; background: #2d5016; color: #fff; padding: 12px 24px; text-decoration: none;">
        View in Admin
      </a>
    </div>
  `;

  await sendZeptoMail({
    to: { address: config.adminEmail },
    replyTo: { address: params.email, name: couple },
    subject: `New wedding planning lead: ${couple}`,
    html,
  });
}

// ─── Consultation confirmation ────────────────────────────────────────────────

interface ConsultationEmailParams {
  name: string;
  email: string;
  scheduledAt: Date;
  durationMin: number;
  location?: string | null;
  notes?: string | null;
  icsBase64?: string;
  partnerName?: string | null;
}

export async function sendConsultationConfirmation(params: ConsultationEmailParams): Promise<void> {
  const couple = params.partnerName ? `${params.name} & ${params.partnerName}` : params.name;
  const when = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
    timeZoneName: "short",
  }).format(params.scheduledAt);

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: #2d5016; padding: 32px; text-align: center;">
        <h1 style="color: #c9a84c; font-size: 26px; margin: 0; letter-spacing: 2px;">
          THE WILD FLOWER VAULT
        </h1>
        <p style="color: #fefcf7; margin: 8px 0 0; font-size: 13px; letter-spacing: 1px;">
          CONSULTATION CONFIRMED
        </p>
      </div>
      <div style="padding: 40px 32px; background: #fefcf7;">
        <p style="font-size: 18px; color: #2d5016; margin: 0 0 16px;">Dear ${escapeHtml(couple)},</p>
        <p style="line-height: 1.6;">
          Your complimentary wedding planning consultation is on the books.
          We&rsquo;ve attached a calendar invite to this email — just open it on your phone or
          computer to add it to your calendar.
        </p>
        <div style="background: #f7f2e8; border-left: 4px solid #c9a84c; padding: 20px; margin: 28px 0;">
          <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 1px; color: #2d5016; text-transform: uppercase;">When</p>
          <p style="margin: 0 0 16px; font-size: 16px; color: #2d5016;">${escapeHtml(when)}</p>
          <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 1px; color: #2d5016; text-transform: uppercase;">Duration</p>
          <p style="margin: 0 0 16px; font-size: 16px; color: #2d5016;">${params.durationMin} minutes</p>
          ${params.location ? `
            <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 1px; color: #2d5016; text-transform: uppercase;">Where</p>
            <p style="margin: 0; font-size: 16px; color: #2d5016;">${escapeHtml(params.location)}</p>
          ` : ""}
        </div>
        ${params.notes ? `
          <p style="line-height: 1.6;"><strong>What to expect:</strong> ${escapeHtml(params.notes)}</p>
        ` : `
          <p style="line-height: 1.6;">
            We'll discuss your vision, timeline, budget, and how we can bring your dream wedding to life.
            Come with any questions — we love getting into the details.
          </p>
        `}
        <p style="line-height: 1.6;">
          Need to reschedule? Just reply to this email and we'll find a new time.
        </p>
        <p style="line-height: 1.6; margin-top: 32px;">
          See you soon,<br />
          <em style="color: #2d5016;">The Wild Flower Vault Team</em>
        </p>
      </div>
      <div style="background: #1a1a1a; padding: 20px; text-align: center;">
        <p style="color: #888; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} The Wild Flower Vault &middot; Des Moines, Iowa
        </p>
      </div>
    </div>
  `;

  const attachments = params.icsBase64
    ? [{ content: params.icsBase64, mimeType: "text/calendar; method=REQUEST", name: "consultation.ics" }]
    : undefined;

  await sendZeptoMail({
    to: { address: params.email, name: couple },
    subject: "Your wedding planning consultation is confirmed",
    html,
    attachments,
  });
}

// ─── MFA code email ───────────────────────────────────────────────────────────

export async function sendMfaCode(toEmail: string, code: string, name?: string | null): Promise<void> {
  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
      <div style="padding: 32px 24px; text-align: center;">
        <h1 style="font-size: 18px; margin: 0 0 8px; color: #2d5016;">The Wild Flower Vault</h1>
        <p style="font-size: 13px; color: #666; margin: 0 0 24px;">Sign-in verification code</p>
        ${name ? `<p style="margin: 0 0 16px; font-size: 14px;">Hi ${escapeHtml(name)},</p>` : ""}
        <p style="margin: 0 0 16px; font-size: 14px;">Enter this 6-digit code to finish signing in:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background: #f7f2e8; padding: 16px; border-radius: 4px; margin: 0 0 16px; font-family: 'SF Mono', Menlo, monospace; color: #2d5016;">
          ${escapeHtml(code)}
        </p>
        <p style="font-size: 12px; color: #888; margin: 0;">
          This code expires in 10 minutes. If you didn't try to sign in, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

  await sendZeptoMail({
    to: { address: toEmail, name: name ?? undefined },
    subject: `Your sign-in code: ${code}`,
    html,
  });
}

// ─── Admin notification when a consultation is booked ────────────────────────

export async function sendConsultationAdminNotice(
  params: ConsultationEmailParams & { leadId?: string | null; icsBase64?: string },
): Promise<void> {
  const config = getZeptoMailConfig();
  if (!config.adminEmail) return;

  const couple = params.partnerName ? `${params.name} & ${params.partnerName}` : params.name;
  const when = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
    timeZoneName: "short",
  }).format(params.scheduledAt);

  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2d5016; margin: 0 0 8px;">New Consultation Booked</h2>
      <p style="color: #666; margin: 0 0 16px;">${escapeHtml(couple)} just booked a consultation. The attached .ics will drop this on your calendar.</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 6px 12px 6px 0; color: #666;">When</td><td>${escapeHtml(when)}</td></tr>
        <tr><td style="padding: 6px 12px 6px 0; color: #666;">Duration</td><td>${params.durationMin} min</td></tr>
        <tr><td style="padding: 6px 12px 6px 0; color: #666;">Email</td><td>${escapeHtml(params.email)}</td></tr>
        ${params.location ? `<tr><td style="padding: 6px 12px 6px 0; color: #666;">Where</td><td>${escapeHtml(params.location)}</td></tr>` : ""}
        ${params.notes ? `<tr><td style="padding: 6px 12px 6px 0; color: #666; vertical-align: top;">Notes</td><td style="white-space: pre-wrap;">${escapeHtml(params.notes)}</td></tr>` : ""}
      </table>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/consultations"
         style="display: inline-block; margin-top: 20px; background: #2d5016; color: #fff; padding: 10px 20px; text-decoration: none;">
        View in Admin
      </a>
    </div>
  `;

  const attachments = params.icsBase64
    ? [{ content: params.icsBase64, mimeType: "text/calendar; method=REQUEST", name: "consultation.ics" }]
    : undefined;

  await sendZeptoMail({
    to: { address: config.adminEmail },
    replyTo: { address: params.email, name: couple },
    subject: `Consultation booked: ${couple} — ${when}`,
    html,
    attachments,
  });
}
